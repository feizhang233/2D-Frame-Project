# 3D Frame 数学核心与后端契约

实现入口：[`src/frame3d`](../src/frame3d/)。依据用户放入 `Math Logic/3D_CONTENT_INDEX.md` 的 A00–A03、L01 和 V00–V18。该目录中的索引是导航文件，其相对链接正文未一起复制；本次实际读取的是相邻 `FEA Document/3D-Frame_Math-Core-Guide/` 中对应原稿。读取文件及 SHA-256 记录在 [`frame3d_sources.json`](frame3d_sources.json)。运行核心和测试不依赖该外部目录。

本实现是**线弹性、小位移、小转角、静力、等截面直梁**，包含 Euler–Bernoulli 双向弯曲、Saint-Venant 扭转，以及闭式 Timoshenko 梁在节点荷载下的响应。提供 Python 数值接口与 FastAPI 接口。现有 2D 前端仍显示二维模型；三维可通过后端和 Python 调用。

## 1. 输入 → 计算 → 输出

| 阶段 | 实现 | 数学内容 |
|---|---|---|
| 输入验证 | `models.py` | 坐标、正有限刚度、参考方向、荷载、支座、释放 |
| 几何 | `geometry.py` | 长度、右手局部基、截面绕轴角 |
| 单元刚度 | `stiffness.py` | 轴向、扭转、双平面 EB/Timoshenko 子块 |
| 变换 | `transformation.py` | 位移、刚度、荷载的功共轭变换 |
| 分布荷载 | `loads.py` | 局部/全局力强度、三点 Gauss 一致积分 |
| 端部释放 | `releases.py` | 同时凝聚刚度与荷载、回代端转角 |
| 总体组装 | `assembly.py`、`solver.py` | 每节点 6 DOF，稠密 K/F |
| 边界与求解 | `solution.py` | 斜支座、非零位移、失活转角、机构与病态诊断 |
| 恢复 | `recovery.py`、`postprocessing.py` | 原始单元端力、平衡内力、位移特解、正应力 |
| 校验 | `validation.py`、`solver.py` | 残差、空间总力/总矩、功与能量、有限精度界限 |
| 后端 | `api.py`、`plotting.py` | JSON 输入输出、六类内力 PNG |

## 2. 单位、自由度与符号

统一 SI：长度 m，力 N，力矩 N·m，E/G 和应力 Pa，面积 m²，Iy/Iz/J m⁴，位移 m，转角 rad。`roll_angle` 单独采用度，与 2D 支座角度输入习惯一致。

节点自由度为 `[u,v,w,rx,ry,rz]`，节点力为 `[Fx,Fy,Fz,Mx,My,Mz]`；单元按 i 端六个、j 端六个排列。节点 ID 必须唯一且为 `1..n`，允许输入节点列表不排序；结果始终按 ID 排序。单元 ID 只要求正且唯一。

局部 x 从 i 指向 j。`reference_vector` 表示希望的局部 y 方向，先去除轴向投影，再归一化；局部 z 为 x×y。这是截面朝向输入，不能只由两端坐标决定。`roll_angle` 按右手定则绕局部 x 旋转该基。必须明确提供参考向量；零向量或近平行向量会报错。默认长度容差 `1e-12 m`，方向正弦容差 `1e-10`。

Q 的三行是局部基在全局坐标中的分量，T = diag(Q,Q,Q,Q)：

```text
d_local = T d_global
K_global = Tᵀ K_local T
f_global = Tᵀ f_local
s_local = K_local d_local − f_local
R_global = K_global d_global − F_global
```

所有转角和力矩按右手定则。EB 中 `rz = v′`、`ry = −w′`。局部 y 挠曲用 EIz，局部 z 挠曲用 EIy。J 是 Saint-Venant 扭转常数，程序不把 J 自动设成 Iy+Iz。

`s_local` 是节点对单元的端作用。截面内力取正 x 面的 `[N,Vy,Vz,Tx,My,Mz]`。**3D 的 Vy 与现有 2D `shear_force` 绘图约定相反**；平面回归比较的是 `Vy = −V_2D`，端力和 Mz 与 2D 相同。新 API 的 `section_force_convention` 明确返回该约定。

## 3. 刚度来源

EB 应变能：

```text
U = 1/2 ∫[EA u′² + GJ rx′² + EIz v″² + EIy w″²] dx
```

轴向 `[0,6]` 为 `(EA/L)[[1,−1],[−1,1]]`；扭转 `[3,9]` 为相同形式的 GJ/L 块。

以 ξ=x/L，弯曲 Hermite 插值为：

```text
H = [1−3ξ²+2ξ³, L(ξ−2ξ²+ξ³), 3ξ²−2ξ³, L(−ξ²+ξ³)]
v = H [v_i,rz_i,v_j,rz_j]ᵀ
w = H S [w_i,ry_i,w_j,ry_j]ᵀ,  S=diag(1,−1,1,−1)
```

积分 `∫BᵀDB dx` 得弯曲块：

```text
       [ 12      6L       −12      6L      ]
EI/L³ [ 6L      4L²      −6L      2L²     ]
       [−12     −6L        12     −6L      ]
       [ 6L      2L²      −6L      4L²     ]
```

EIz 块装入 `[1,5,7,11]`；EIy 块先作 SᵀKbS，再装入 `[2,4,8,10]`。自由单元有六个刚体模态和六个变形模态。

Timoshenko 采用 A03 的闭式均质、无耦合子块，需正的 `Asy`、`Asz`。每个平面令 `φ=12EI/(GAs L²)`，上式整体除以 `(1+φ)`，两个转角对角项改成 `(4+φ)L²`，转角交叉项改成 `(2−φ)L²`。它来自剪力、曲率和剪切关系的积分，不是把一个剪切矩阵直接叠加在 EB 刚度上。

悬臂端横力 P 的端位移为 `PL³/(3EI)+PL/(GAs)`；转角保持 `±PL²/(2EI)`。As→∞ 时回到 EB。本实现**拒绝所有 Timoshenko 分布荷载记录**，包括零记录，避免把 EB 荷载插值混入另一种离散。

## 4. 荷载、释放与求解

`DistributedLoad` 描述整根杆上按实际长度线性变化的 `qx/qy/qz/mx`，每个分量分别给 `_i` 和 `_j`。均布必须明确给相等的两端强度；只给 `_j` 表示从零递增的三角形荷载。

`coordinate_system="local"` 为默认值，`"global"` 将两端的三个力分量先用 Q 旋转。**mx 始终是绕局部 x 的分布扭矩**，不随 `coordinate_system` 改变；不接受分布 My/Mz。全局荷载强度仍是每单位实际杆长，投影长度荷载须由调用方换算。节点力和力矩均直接用全局坐标。

一致荷载 `f=∫Nᵀq dx` 用三点 Gauss 积分，能精确积分此处 Hermite×线性荷载的四次多项式。均布 qy 的 `[v_i,rz_i,v_j,rz_j]` 荷载为 `[qL/2,qL²/12,qL/2,−qL²/12]`；qz 的转角项反号。各荷载记录累加，输入对象不变。

`releases` 为局部转动索引的集合：`3,4,5`（i 端 rx/ry/rz），`9,10,11`（j 端）。对保留 p、释放 r：

```text
K̄pp = Kpp − Kpr solve(Krr,Krp)
f̄p  = fp  − Kpr solve(Krr,fr)
dr   = solve(Krr,fr−Krp dp)
```

使用原 K、f 和回代后的 d 恢复端力并检查 sr≈0。单端弯曲释放、双端弯曲释放及倾斜局部释放均有回归。Krr 奇异时拒绝，例如把同一杆两端扭转同时释放；不通过伪逆或小弹簧替代物理连接。此接口不表示半刚接、刚域偏置或任意连接本构。

释放导致某个节点转角方向完全不连接刚度时，以该节点连接的保留局部转轴构造方向矩阵，仅移除其零空间。其余结构机构仍由求解器拒绝。三维倾斜释放可能对应全局多个分量的组合，故结果返回 `inactive_dof_vectors`（每行一个全局单位方向向量）。失活方向取零作为节点转角参考值；**实际构件端转角须读取 `elements[].local_displacements`**。失活方向承受力矩时报告无平衡解。

支座可给 `axes`（右手正交 3×3 行基），六个布尔标志和 `_value` 均在支座坐标系中。每个节点的重复支座记录允许合并，但必须用相同基，且共同约束不能给不同值。全局结果通过支座变换转回全局坐标。

求解 `Kff df = Ff − Kfc dc`。对角缩放后使用直接线性求解；缩放最小特征值不大于最大值的 `1e-12` 时，报告机构或病态。采用稠密 NumPy 线性代数，适合中小模型；不是稀疏大规模求解器。

## 5. 内场与验证

由左端作用 s_i 和荷载积分恢复截面内力：

```text
N  = −Fx_i − ∫qx dx        Tx = −Mx_i − ∫mx dx
Vy = −Fy_i − ∫qy dx        My = −My_i + ∫Vz dx
Vz = −Fz_i − ∫qz dx        Mz = −Mz_i − ∫Vy dx
```

再积分本构/运动学关系 `u′=N/EA`、`rx′=Tx/GJ`、`ry′=My/EIy`、`rz′=Mz/EIz`。EB 用 `v′=rz`、`w′=−ry`；Timoshenko 用 `v′=rz+Vy/GAsy`、`w′=−ry+Vz/GAsz`。

这给出与单元端自由度匹配的平衡内场。对于本实现的常参数 EB 和线性荷载，它包含四次/五次位移特解；均布 qy 时等价于在 Hermite 场上加 `q x²(L−x)²/(24EIz)`。这是对 A02 均布泡函数的线性荷载扩展，通过独立单位力积分验证。不能推广到变截面、曲梁或未支持的 Timoshenko 分布荷载。

若给 `section_points=[{"y":...,"z":...}]`，返回每个点沿杆的正应力：

```text
sigma_x = N/A + My*z/Iy − Mz*y/Iz
```

`normal_stress[点索引][采样位置]` 的单位为 Pa。未指定点则为 `[]`。不输出通用截面的扭转剪应力、局部热点应力或 von Mises 应力；缺少截面形状时这些量没有充分依据。

验证包含：

- 量纲缩放后的刚度对称性；自由力与自由力矩分开归一化的残差。
- 以第一个节点为参考原点，包含 r×F 的全局总力、总矩平衡。
- 单元右端截面力与端作用一致、释放端矩为零、积分位移/转角与端节点值一致。
- 完整内场的 `U=1/2∫(N²/EA+Tx²/GJ+My²/EIy+Mz²/EIz+剪切项)dx`。
- `2U=节点荷载功+支座反力功+分布荷载沿完整位移场的功`；非零支座位移的反力功必须保留。

分布荷载存在时，`1/2 dᵀKd` 不一定等于包含特解的全部内场能量。能量校验返回 `energy_absolute_error`（J）和 `energy_roundoff_bound`（J）；后者按 `64 ε (|d|ᵀ|K||d|+功项绝对尺度)` 估计浮点抵消界限。`energy_residual_ratio` 是扣除该界限后的相对误差，避免规定刚体运动时近零能量误报。其他主要残差阈值为 `1e-8`；它们是数值诊断阈值，不是结构设计允许误差。

## 6. Python 与 HTTP 接口

Python 沿用 2D 的结构：

```python
from frame3d import Node, FrameElement, Support, NodalLoad, solve_frame

result = solve_frame(
    nodes=[Node(1, 0, 0, 0), Node(2, 2, 0, 0)],
    elements=[FrameElement(
        id=1, node_i=1, node_j=2, E=200e9, G=80e9,
        A=.01, Iy=8e-6, Iz=5e-6, J=1e-5, reference_vector=(0, 1, 0),
    )],
    supports=[Support(1, u=True, v=True, w=True, rx=True, ry=True, rz=True)],
    nodal_loads=[NodalLoad(2, fy=1000)],
    number_of_points=101,
)
assert result.validation.passed
print(result.nodal_displacements[1])
# [0, 0.002666666667, 0, 0, 0, 0.002]
```

原服务器启动方式不变，新增：

```text
POST /api/v1/3d/solve
POST /api/v1/3d/plots/{component}
```

原 `POST /api/v1/solve` 继续使用原 2D 输入/输出。新入口仍用 `nodes/elements/supports/nodal_loads/distributed_loads/number_of_points/deformation_scale/include_plots/plot_dpi`，并增加 `section_points`。默认 `include_plots=true`；只需要数值时传 false。

响应沿用 `displacement_dof_order/force_dof_order/free_dofs/restrained_dofs/nodal_displacements/nodal_reactions/elements/validation/plots` 的组织，并增加失活方向、活动未知量数、应力点与内场约定。`free_dofs`、`restrained_dofs` 是支座坐标下的零起始索引；`free_dofs` 含失活自由方向所在分量，实际求解维数为 `active_dof_count`。节点反力数组中的自由分量是残差。`local_axes` 保存实际使用的截面基。

`component` 以及嵌入图片字典键为：`axial_force`、`shear_force_y`、`shear_force_z`、`torsional_moment`、`bending_moment_y`、`bending_moment_z`。直接图片端点返回 `image/png`；嵌入图片包含 `filename/media_type/data_uri`。模型错误、机构、不支持的理论/荷载组合返回 422。

调用示例（从仓库根目录）：

```bash
curl -X POST http://127.0.0.1:8000/api/v1/3d/solve \
  -H 'Content-Type: application/json' \
  --data-binary @examples/cantilever_3d.json
```

另有 [`space_frame_3d.json`](../examples/space_frame_3d.json)，对应 V15，末端 z 位移应为 `0.033166666667 m`，总能量 `16.583333333 J`。

可独立启动三维服务：

```bash
python -m uvicorn frame3d.api:app --host 127.0.0.1 --port 8001
# 或重新安装本地项目后使用 frame3d-api；默认端口 8001
```

独立服务沿用 `/api/v1/solve`、`/api/v1/plots/{component}`、`/health`、`/docs` 和 `/openapi.json`。`FRAME3D_HOST`、`FRAME3D_API_PORT` 配置命令入口的地址。独立核心/服务不要求数据库；既有服务器的账户和模型存储继续沿用原逻辑。

## 7. 目标仓库验证映射

全部测试直接调用本仓库 `frame3d`；没有把资料包的 `19/19` 标记当成实现通过证据。

| 来源 ID | 本仓库测试内容/独立依据 |
|---|---|
| V00 | 倾斜局部基解析值、右手性、退化输入、参考向量尺度 |
| V01 | 闭式矩阵对独立 BᵀDB Gauss 积分 |
| V02 | EB/Timoshenko 的六个刚体模态与缩放秩 |
| V03–V06 | 轴向、扭转、两方向端横力的解析位移/反力/能量 |
| V07 | 纯弯曲二次位移、线性转角、截面正应力 |
| V08 | 均布一致荷载、自由端作用、内部位移特解、内场能量 |
| V09 | 两段轴杆沉降与 ±2 MN 反力、重复约束冲突 |
| V10 | 几何、参考向量、力、矩一起旋转后的协变性 |
| V11 | 截面旋转 90° 后柔度比 Iz/Iy |
| V12 | 荷载/刚度同步凝聚、端角回代、全局倾斜释放方向 |
| V13 | 两平面 Timoshenko 剪切位移与 EB 极限 |
| V14 | 一、二、四、八单元倾斜悬臂组装与解析场 |
| V15 | 折杆弯扭耦合，对独立 Castigliano 能量积分 |
| V16 | 有/无荷载的机构拒绝、负刚度/错误引用诊断 |
| V17 | 三角形荷载总力、总矩、端位移；线性荷载全场对单位力积分 |
| V18 | 线性插值虚假剪切能 213.333 J 与闭式单元纯弯能量 1 J |
| 扩展 | 固固梁特解、斜支座沉降、双端弯曲释放、刚体规定运动能量 |
| 2D 回归 | 平面刚架的位移、反力、端力、剪力/弯矩符号映射 |
| HTTP | 双服务入口、OpenAPI、422、图片、示例和 2D 契约隔离 |

运行：

```bash
python -m pytest tests/test_frame3d_core.py tests/test_frame3d_api.py
python -m pytest
```

2026-09-18 本地验收：完整测试 **239 项通过**（现有 2D 147 项 + 新增 3D 92 项）；前端 TypeScript/Vite 构建通过。已实际启动安装后的 `frame3d-api`，经本机 HTTP 检查健康状态、V15 JSON 求解和 My 图片端点，核对末端位移 `0.03316666666666655 m`、能量 `16.583333333333222 J`，并查看生成的 PNG。临时服务在验证后关闭。该记录限定于本次数值与接口验证，不表示工程认证。

## 8. 适用边界

不包含几何/材料非线性、屈曲、动力、约束翘曲、任意半刚接、耦合复合截面、剪心偏置、变截面或曲梁。支座是节点处的独立定向约束，不是任意多点约束。分布荷载限定整杆线性中心线力和局部扭矩；局部点荷载可通过分段并增加节点表达。结果基于给定主轴截面刚度；不能从这些测试推断真实截面库、工程规范验算或通用网格收敛认证。
