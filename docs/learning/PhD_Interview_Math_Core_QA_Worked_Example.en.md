---
title: "2D Frame Finite Elements: PhD Interview Questions and a Worked Example"
lang: en
date: "2026-09-10"
---

# How to Use This Guide

This guide is based on the **mathematical core and current solver in 2D-Frame-Project**. It prepares you to explain why a model is formulated in a particular way, where its equations come from, and how you establish confidence in its results. The questions are practice prompts derived from the core concepts, not a record of questions asked by a particular university or supervisor.

The model covers two-dimensional, straight, prismatic, linearly elastic Euler–Bernoulli frames under static loading, with small displacements and rotations. Each node has three degrees of freedom: horizontal displacement, vertical displacement, and rotation. Shear deformation, plasticity, geometric nonlinearity, buckling, and dynamics appear as **extension questions**; they are not presented as capabilities already implemented in the current solver.

The guide follows this sequence:

**Physical assumptions → displacement and strain → constitutive law and energy → shape functions and stiffness → coordinate transformation and assembly → loads and constraints → solution → reactions and internal forces → verification.**

- Part I: 24 interview questions, each with a suggested oral answer and a follow-up question.
- Part II: a two-element inclined cantilever, derived from the shape functions through to the numerical results.
- Part III: the analytical solution, discretization error, and energy checks for the same example.
- Closing sections: variations of the problem, interview practice, source mapping, and verification records.

For a first pass, work through Q1–Q16 and Steps 1–11 of the example before studying the error analysis and research extensions. All signs follow this project's conventions; bending-moment conventions from other textbooks are not mixed into the derivation.

# Part I. 24 Potential Interview Questions

## A. Physical Modeling: What Are You Solving?

### Q1. Explain your finite element solver in one minute.

**Suggested answer:** I discretize the structure into two-node frame elements, with nodal displacements and rotations as the unknowns. Shape functions describe displacement within each element. Differentiating these fields gives strains, and the linear elastic constitutive law gives internal forces and strain energy, from which I derive the element stiffness. After coordinate transformation, assembly, and application of boundary conditions, I solve for nodal displacements, recover reactions and section forces, and verify them against equilibrium and analytical solutions.

**Follow-up: Why solve for displacement first?** This is a displacement-based finite element method. Shared nodal degrees of freedom enforce discrete compatibility, while equilibrium is imposed through the weak form. Not every finite element formulation uses displacement as its only unknown field.

### Q2. What distinguishes a bar, a beam, and a frame element?

**Suggested answer:** A bar element represents axial extension or contraction. A planar beam element represents transverse displacement and bending rotation. A planar frame element combines axial and bending behavior, giving three degrees of freedom $[u,v,\phi]$ per node. At a rigid joint, connected members share a common rotation and can transfer bending moments.

**Follow-up: Can you model a hinge by setting the rotation to zero?** No. Zero rotation is a rotational restraint; a hinge permits rotation and generally carries no moment across the released connection. An internal hinge or member-end release requires the corresponding moment release or a change in the degrees of freedom. A pinned support and a member-end moment release are not interchangeable concepts.

### Q3. What is the central assumption of Euler–Bernoulli beam theory?

**Suggested answer:** Cross-sections remain plane and perpendicular to the deformed neutral axis, so transverse shear deformation is neglected. For small rotations, $\phi=dv/dx$. Applicability depends on whether shear deformation is negligible relative to bending deformation, not simply on whether the material is linearly elastic.

**Follow-up: What would you use for a short, deep beam?** Consider Timoshenko beam theory, in which section rotation is an independent field and the model includes shear strain $\gamma=dv/dx-\phi$ and shear stiffness. The signs must remain consistent with the selected rotation convention.

### Q4. Are linear elasticity and geometric linearity the same assumption?

**Suggested answer:** No. Linear elasticity describes the stress–strain relation. Geometric linearity concerns the strain approximation and whether equilibrium is written on the undeformed geometry. A material can remain linearly elastic while the structural response becomes nonlinear because of large rotations or second-order effects.

**Follow-up: If the load doubles, must displacement double?** This holds for a linear problem with unchanged stiffness and boundary conditions and homogeneous prescribed displacements. If nonzero support movements are prescribed, distinguish the load-induced displacement increment from the response caused by those prescribed movements.

## B. Kinematics, Weak Form, and Interpolation

### Q5. How do nodal displacements lead to stresses?

**Suggested answer:** First interpolate $u(x),v(x)$, then differentiate to obtain axial strain $\varepsilon_0=du/dx$ and curvature $\kappa=d^2v/dx^2$. Using the centroidal reference axis, the strain in a fiber at distance $y$ from that axis is

$$\varepsilon_x(x,y)=\varepsilon_0(x)-y\kappa(x),\qquad \sigma_x=E\varepsilon_x.$$

Integration over the cross-section gives $N=EA\varepsilon_0$. This project defines bending moment as $M=EI\kappa$, corresponding to $\sigma_x=N/A-My/I$.

**Follow-up: Why are axial deformation and bending uncoupled locally?** The model uses a centroidal reference axis, a homogeneous section, and linear kinematics. Since $\int_A y\,dA=0$, the axial–bending cross-term in the energy vanishes. An eccentric reference axis or a more general section model may introduce coupling.

### Q6. Why use a weak form instead of solving the differential equation directly?

**Suggested answer:** The strong form requires differential equilibrium at every point. The weak form imposes virtual-work equilibrium for every admissible virtual displacement. Integration by parts reduces the derivative requirements on the displacement field and introduces end forces and moments naturally through boundary terms. This makes piecewise approximation functions usable in the solution.

$$\int_0^L EA\,u_{,x}\delta u_{,x}\,dx+
\int_0^L EI\,v_{,xx}\delta v_{,xx}\,dx
=\delta W_{\mathrm{ext}}.$$

**Follow-up: Does a weak form make equilibrium less important?** No. Equilibrium remains central, but it is enforced within the chosen test space. An approximate solution on a finite mesh need not satisfy the strong form pointwise.

### Q7. Why use linear axial interpolation and cubic Hermite bending interpolation?

**Suggested answer:** Two axial end displacements determine a linear polynomial. Bending provides displacement and rotation at each end, giving four conditions that a cubic polynomial can satisfy. The standard displacement-based Euler–Bernoulli weak form contains second derivatives and requires sufficiently smooth conforming interpolation. Hermite interpolation maintains displacement and slope continuity between adjacent collinear elements.

**Follow-up: Is cubic Hermite interpolation the only possible choice?** No. It is the standard two-node conforming choice used here. Mixed, nonconforming, and discontinuous formulations, as well as other smooth bases, use different constructions. The continuity requirement should not be applied without qualification to every beam finite element formulation.

### Q8. Why does the stiffness matrix have the form $\int B^TDB\,dx$?

**Suggested answer:** Substitute the discrete strain $\varepsilon=Bd$ into the strain energy $U=\frac12\int\varepsilon^TD\varepsilon\,dx$. This gives $U=\frac12d^Tkd$, where $k=\int B^TDB\,dx$. Differentiating the energy with respect to the degrees of freedom gives the internal force vector $f_{\mathrm{int}}=kd$.

**Follow-up: What does an individual stiffness entry mean?** $k_{ij}$ is the generalized force at degree of freedom $i$ caused by a unit generalized displacement at degree of freedom $j$, with all other degrees of freedom held at zero. Translations and rotations have different units, so the matrix blocks also have different physical dimensions.

## C. Matrices and Coordinate Systems

### Q9. Why is the element stiffness matrix symmetric?

**Suggested answer:** In this model, $D$ is symmetric, so $(B^TDB)^T=B^TDB$. The same result follows by viewing stiffness as the second derivative of strain energy with respect to the degrees of freedom. It is consistent with reciprocity in a linear conservative elastic system.

**Follow-up: Is every tangent matrix in mechanics symmetric?** No. Nonconservative loads, non-associated constitutive models, or certain discretizations can lead to a nonsymmetric tangent.

### Q10. Is the element matrix positive definite? Why is it singular?

**Suggested answer:** An unconstrained planar frame element has two rigid-body translations and one rigid-body rotation. These motions produce no strain energy, so the element matrix is positive semidefinite rather than positive definite. For valid positive $E,A,I,L$, it has three rigid-body zero modes.

**Follow-up: When does the assembled system have a unique solution?** For a stable linear elastic model with valid connectivity and material properties, the constrained matrix $K_{ff}$ is positive definite after all rigid-body motions and mechanisms have been removed. If it is singular, check connectivity, supports, and releases first. Adding a small diagonal number should not be used to hide a modeling problem.

### Q11. Why use $T$ for displacement but $T^T$ for force?

**Suggested answer:** Define $d'=Td$. Invariance of virtual work gives $\delta d^Tf=\delta d'^Tf'=\delta d^TT^Tf'$, hence $f=T^Tf'$. It follows that $k=T^Tk'T$.

**Follow-up: Can stiffness be transformed by multiplication on only one side?** No. Both the force components and the displacement components change. Both transformations are needed to preserve the energy relation.

### Q12. What does stiffness assembly actually enforce?

**Suggested answer:** Adjacent elements share the displacement and rotation of their common node, enforcing compatibility. Their end-force contributions add at that node to produce nodal equilibrium. If $A_e$ extracts the element degrees of freedom, so that $d_e=A_ed$, then

$$K=\sum_e A_e^TT_e^Tk'_eT_eA_e.$$

**Follow-up: Why add stiffness contributions at a shared node?** The same virtual displacement at the shared node causes all connected elements to do work. Their energies, and therefore their force responses associated with that degree of freedom, add together.

## D. Loads and Boundary Conditions

### Q13. Why not replace a uniform load with two equal end forces only?

**Suggested answer:** A consistent nodal load must preserve work for every virtual displacement represented by the chosen shape functions, not merely preserve the resultant force. Rotation is also a beam degree of freedom, so a uniform transverse load generally requires a pair of equivalent end moments as well.

$$p^{0\prime}=\int_0^L N_f^Tq\,dx.$$

**Follow-up: The two equivalent moments sum to zero. Why not delete them?** The virtual rotations at the two ends are generally different, so the moments' virtual work need not cancel. Deleting them changes how the load acts on the discrete displacement field.

### Q14. How do you apply support settlement and an inclined roller constraint?

**Suggested answer:** The prescribed displacement $d_c$ may be nonzero. The free-degree-of-freedom equation is

$$K_{ff}d_f=\bar P_f-K_{fc}d_c.$$

An inclined roller constrains displacement normal to the support. Rotate into support coordinates or impose $n_xu+n_yv=\bar d_n$; do not arbitrarily set global $u$ or $v$ to zero.

**Follow-up: Can settlement generate internal forces without an applied load?** Yes, depending on the constraints and compatibility. If a prescribed movement forces the structure to strain, internal forces arise even when direct applied loads are zero.

### Q15. Why not explicitly calculate $K^{-1}$?

**Suggested answer:** The task is to solve a linear system. An appropriate matrix factorization is generally more efficient in computation and storage and better suited to maintaining numerical accuracy. An explicit inverse is unnecessary. Cholesky factorization is an option for symmetric positive-definite systems, and large problems should exploit sparsity.

**Follow-up: Does a small residual guarantee a small displacement error?** No. An ill-conditioned matrix can amplify input and round-off errors. Also consider conditioning, degree-of-freedom scaling, the physical model, and discretization error.

### Q16. Why subtract applied loads when recovering reactions and element end forces?

**Suggested answer:** Full equilibrium is $Kd=\bar P+R$, so $R=Kd-\bar P$. Element end forces are $q'=k'd'-p^{0\prime}$: the elastic nodal force vector $k'd'$ balances both the end actions and the consistent representation of member loading. Subtracting $p^{0\prime}$ isolates the end actions. Otherwise, even a free end can show an incorrect end moment.

**Follow-up: How are fixed-end forces related to consistent nodal loads?** If all element nodal degrees of freedom are fixed, $d'=0$, so the fixed-end forces are $-p^{0\prime}$. They have the opposite sign to the consistent load vector and serve a different role in the calculation.

## E. Results and Verification

### Q17. Is an element end moment the same as a section bending moment?

**Suggested answer:** First specify the signs. This project uses

$$m_i=-M(0),\quad m_j=M(L),\quad f_{yi}=V(0),\quad f_{yj}=-V(L).$$

The positive directions of nodal end actions and section resultants differ at the left end. A positive support reaction moment can therefore correspond to a negative section bending moment at the fixed end.

**Follow-up: Why might two textbooks show opposite shear-force signs?** Check the cut face, positive force directions, and differential relations. Different conventions can describe the same physical state if equilibrium, stress recovery, and the boundary mapping are consistent.

### Q18. Under a uniform load, why not plot bending moment using only $EI v_h''$?

**Suggested answer:** The second derivative of a cubic finite element displacement is linear, whereas the exact bending moment under a constant distributed load is quadratic. Differentiating displacement gives a discrete constitutive moment. Integrating the actual load from recovered end forces gives an equilibrium-recovered moment. These fields need not coincide on a finite mesh.

**Follow-up: Which field is guaranteed to be exact?** In general, neither should be declared exact in advance. For the special constant-stiffness, statically determinate cantilever in this guide, correct end forces and the actual loading recover the exact equilibrium resultants. That conclusion must not be extended to arbitrary frames.

### Q19. Which independent verification checks would you use?

**Suggested answer:** Check units and load directions, stiffness symmetry and rigid-body modes, residuals in free directions, global force and moment balance, and element end-force equilibrium. Then compare with independent analytical solutions and mesh-refinement results.

**Follow-up: Can forces and moments be combined directly in one residual norm?** They have different dimensions. Report separate force and moment tolerances, or first divide moments by a characteristic length $L_0$ and nondimensionalize using a characteristic force. An unscaled mixed norm depends on the chosen unit system.

### Q20. If the nodal displacements match the analytical solution, is discretization error zero?

**Suggested answer:** No. Some one-dimensional constant-stiffness problems have nodal exactness, while the interpolated field inside each element remains approximate. Check interior displacement, curvature, and energy error separately.

**Follow-up: How does your example demonstrate this?** Its two-element solution matches the analytical nodal displacements, but each element midpoint still has approximately $0.010417\ \mathrm{mm}$ of transverse displacement error. Halving the element length reduces this particular midpoint error by a factor of about $1/16$.

## F. Research Extensions

### Q21. How would you extend the linear solver to geometric nonlinearity?

**Suggested answer:** Reformulate the kinematics, internal forces, and equilibrium; updating a few stiffness coefficients is not enough. With residual $r=f_{\mathrm{ext}}-f_{\mathrm{int}}$, the Newton correction satisfies

$$K_T\Delta d=r,\qquad d^{(k+1)}=d^{(k)}+\Delta d.$$

For displacement-independent external loads, $K_T=\partial f_{\mathrm{int}}/\partial d$. If the external forces depend on deformation, their derivative must also be included with the appropriate sign. Iterative convergence must be checked at each load step.

**Follow-up: Why is a consistent tangent important?** It is the correct linearization of the discrete residual and enables the local rapid convergence of Newton's method under suitable conditions. This is a research extension; the current core remains a linear static solver.

### Q22. Can a linear static solver directly predict a buckling load?

**Suggested answer:** No. The linear elastic static stiffness does not describe the stress-dependent geometric stiffness. A linear eigenvalue buckling analysis needs a prestress state and its geometric stiffness, for example solving $(K_E+\lambda K_G)\psi=0$ under a specified sign convention.

**Follow-up: Is an eigenvalue buckling load the actual load capacity?** No. It predicts a bifurcation for an idealized model. It does not replace an assessment of imperfections, material nonlinearity, limit points, or the postbuckling path.

### Q23. Why can Timoshenko elements suffer from shear locking?

**Suggested answer:** In the slender-beam limit, the shear strain should approach zero. If the discrete displacement and rotation spaces cannot represent this constraint appropriately, they generate excessive artificial shear energy and an overly stiff response. Possible approaches include suitable interpolation, mixed formulations, or selective integration.

**Follow-up: Does using fewer integration points always solve the problem?** No. Reduced integration may introduce nonphysical zero-energy modes. Verify rank, energy, benchmark solutions, and convergence together. The Euler–Bernoulli element in this project has no shear-energy term.

### Q24. How would you explain the research value of this project?

**Suggested answer:** Distinguish implementation of a classical method from research novelty. This project demonstrates that I can connect modeling assumptions, variational derivation, discretization, solution, and verification. Research requires a new, testable question, such as the accuracy, robustness, or computational cost of a nonlinear formulation for stability analysis of thin-walled structures.

**Follow-up: How would you design the next comparison study?** Define the problem and reference solution first. Control the mesh, tolerances, and computational budget, then compare the accuracy, convergence, and failure conditions of the candidate methods. A plausible-looking deformation plot is not sufficient evidence.

# Part II. A Reusable Worked Example

## Problem: A Two-Element Inclined Cantilever

A straight, prismatic planar frame member is divided into two equal-length elements with a rigid connection between them. Global $X$ points right and $Y$ points up. Counterclockwise rotations and moments are positive.

| Node | $X$ (m) | $Y$ (m) | Condition |
|---|---:|---:|---|
| 1 | 0 | 0 | Fully fixed: $u_1=v_1=\phi_1=0$ |
| 2 | 1.2 | 1.6 | Shared rigid connection between the elements |
| 3 | 2.4 | 3.2 | Free end with $F_X=10\ \mathrm{kN}$ and $F_Y=0$ |

![Problem schematic: two-element inclined cantilever and local load direction.](assets/interview_inclined_cantilever.png)

Element 1 connects $1\to2$ and element 2 connects $2\to3$. The material and section properties are

$$E=200\ \mathrm{GPa},\qquad A=5.0\times10^{-3}\ \mathrm{m^2},\qquad I=4.0\times10^{-5}\ \mathrm{m^4}.$$

Both elements carry a uniform load $w=2\ \mathrm{kN/m}$ **in the negative local $y'$ direction**, measured per unit of actual member length. This is not a globally vertical load. Neglect any additional self-weight contribution.

**Required:**

1. Define the local axes, degrees of freedom, shape functions, and element stiffness.
2. Derive the consistent nodal loads and demonstrate coordinate transformation and two-element assembly.
3. Calculate all nodal displacements, the fixed-end reactions, and both element end-force vectors.
4. Determine $N(x),V(x),M(x)$ along the full member.
5. Verify the results using an analytical solution, global equilibrium, energy, and mesh refinement.
6. Explain which quantities are exact in this example and which retain discretization error.

The example connects axial deformation and bending, coordinate rotation and assembly, distributed loading, and force recovery. It does not cover the directional coupling of noncollinear beam–column joints, redistribution in statically indeterminate frames, or nonlinearity. Its generality lies in the reusable derivation workflow, not in representing every structural configuration.

## Step 1. Geometry, Stiffness Scales, and Load Directions

Each element has length

$$h=\sqrt{1.2^2+1.6^2}=2\ \mathrm m,\qquad L=2h=4\ \mathrm m.$$

The direction cosines are

$$c=\frac{1.2}{2}=0.6,\qquad s=\frac{1.6}{2}=0.8.$$

The local unit vectors are therefore $e_{x'}=(0.6,0.8)$ and $e_{y'}=(-0.8,0.6)$. Below, $x$ denotes the **local axial coordinate along the full member**, measured from the fixed end. The coordinate within an individual element is denoted by $t\in[0,h]$.

Use kN and m for the hand calculation:

$$E=2.0\times10^8\ \mathrm{kN/m^2},\qquad EA=10^6\ \mathrm{kN},\qquad EI=8000\ \mathrm{kN\,m^2}.$$

Transform the global tip force into local components:

$$\begin{bmatrix}F_{x'}\\F_{y'}\end{bmatrix}
=\begin{bmatrix}0.6&0.8\\-0.8&0.6\end{bmatrix}
\begin{bmatrix}10\\0\end{bmatrix}
=\begin{bmatrix}6\\-8\end{bmatrix}\ \mathrm{kN}.$$

Thus, the tip load consists of $6\ \mathrm{kN}$ of axial tension and $8\ \mathrm{kN}$ acting in the negative local transverse direction. The uniform load is $q_y=-2\ \mathrm{kN/m}$, with global components

$$\begin{bmatrix}q_X\\q_Y\end{bmatrix}
=\begin{bmatrix}0.6&-0.8\\0.8&0.6\end{bmatrix}
\begin{bmatrix}0\\-2\end{bmatrix}
=\begin{bmatrix}1.6\\-1.2\end{bmatrix}\ \mathrm{kN/m}.$$

**Physical meaning:** A globally horizontal force causes both axial extension and bending in an inclined member. Clarify the load coordinate system before calculating stiffness.

## Step 2. From Kinematics to Strain Energy and the Weak Form

Primes are omitted from the local displacement fields in this step. Euler–Bernoulli kinematics gives

$$u_x(t,y)=u(t)-y\frac{dv}{dt},\qquad
\varepsilon_x=\frac{du}{dt}-y\frac{d^2v}{dt^2}.$$

Using $\int_A y\,dA=0$ and $I=\int_A y^2\,dA$, integration over the cross-section gives

$$U_e=\frac12\int_0^h\left[EA\left(\frac{du}{dt}\right)^2+
EI\left(\frac{d^2v}{dt^2}\right)^2\right]dt.$$

Define $\varepsilon_0=u_{,t}$ and $\kappa=v_{,tt}$, so that $N=EA\varepsilon_0$ and $M=EI\kappa$.

Taking the variation of the energy gives the internal virtual work:

$$\delta U_e=\int_0^h\left(N\delta u_{,t}+M\delta v_{,tt}\right)dt.$$

Integrate the axial term by parts once and the bending term by parts twice:

$$\int_0^hN\delta u_{,t}dt=[N\delta u]_0^h-\int_0^hN_{,t}\delta u\,dt,$$

$$\int_0^hM\delta v_{,tt}dt=[M\delta\phi]_0^h-[M_{,t}\delta v]_0^h+
\int_0^hM_{,tt}\delta v\,dt.$$

Write the external virtual work as the work of distributed loads plus end actions. Comparing the coefficients of the virtual displacement fields in the interior gives

$$N_{,t}+q_x=0,\qquad M_{,tt}=q_y.$$

With $V=M_{,t}$, we have $V_{,t}=q_y$. Comparing boundary terms gives

$$f_{xi}=-N(0),\ f_{xj}=N(h),\quad
f_{yi}=V(0),\ f_{yj}=-V(h),\quad
m_i=-M(0),\ m_j=M(h).$$

**Physical meaning:** Stiffness, distributed loading, and end-force signs follow from one virtual-work statement. Their conventions are therefore established together rather than memorized separately.

## Step 3. From End Degrees of Freedom to Displacement Fields

The local degree-of-freedom ordering is fixed as

$$d'_e=[u'_i,v'_i,\phi'_i,u'_j,v'_j,\phi'_j]^T.$$

### 3.1 Axial interpolation

Assume $u(t)=a_0+a_1t$. Applying $u(0)=u'_i$ and $u(h)=u'_j$ gives

$$u(t)=\left(1-\frac th\right)u'_i+\frac th u'_j,
\qquad \varepsilon_0=\begin{bmatrix}-1/h&1/h\end{bmatrix}
\begin{bmatrix}u'_i\\u'_j\end{bmatrix}.$$

Therefore,

$$k'_a=\int_0^hEA B_a^TB_a\,dt
=\frac{EA}{h}\begin{bmatrix}1&-1\\-1&1\end{bmatrix}.$$

### 3.2 Bending interpolation

Assume $v(t)=a_0+a_1t+a_2t^2+a_3t^3$. The left-end conditions give $a_0=v'_i$ and $a_1=\phi'_i$. The two right-end conditions are

$$a_2h^2+a_3h^3=v'_j-v'_i-h\phi'_i,$$

$$2a_2h+3a_3h^2=\phi'_j-\phi'_i.$$

Multiply the second equation by $h$ and subtract twice the first equation:

$$a_3h^3=h(\phi'_i+\phi'_j)-2(v'_j-v'_i).$$

Back-substitution gives

$$a_2=\frac{3(v'_j-v'_i)}{h^2}-\frac{2\phi'_i+\phi'_j}{h},\qquad
 a_3=-\frac{2(v'_j-v'_i)}{h^3}+\frac{\phi'_i+\phi'_j}{h^2}.$$

Set $\xi=t/h$ and collect the coefficients of the end degrees of freedom:

$$v(t)=H_1v'_i+H_2\phi'_i+H_3v'_j+H_4\phi'_j,$$

$$H_1=1-3\xi^2+2\xi^3,\qquad H_2=h(\xi-2\xi^2+\xi^3),$$

$$H_3=3\xi^2-2\xi^3,\qquad H_4=h(-\xi^2+\xi^3).$$

Differentiate twice:

$$B_b=\begin{bmatrix}
(-6+12\xi)/h^2&(-4+6\xi)/h&(6-12\xi)/h^2&(-2+6\xi)/h
\end{bmatrix}.$$

**Dimensional check:** $H_1,H_3$ are dimensionless. $H_2,H_4$ have units of length, so multiplying them by dimensionless rotations produces displacement.

## Step 4. Integrate to Obtain the Local Stiffness

Substitution into the bending energy gives $k'_b=\int_0^h B_b^TEIB_b\,dt$. Evaluate two representative entries using $dt=h\,d\xi$:

$$k_{b,11}=\frac{EI}{h^3}\int_0^1(-6+12\xi)^2d\xi
=\frac{EI}{h^3}(36-72+48)=\frac{12EI}{h^3},$$

$$k_{b,12}=\frac{EI}{h^2}\int_0^1(-6+12\xi)(-4+6\xi)d\xi
=\frac{EI}{h^2}(24-42+24)=\frac{6EI}{h^2}.$$

Evaluating the remaining entries in the same way gives

$$k'_b=\frac{EI}{h^3}
\begin{bmatrix}
12&6h&-12&6h\\
6h&4h^2&-6h&2h^2\\
-12&-6h&12&-6h\\
6h&2h^2&-6h&4h^2
\end{bmatrix}.$$

For this example, the coefficients are

$$\frac{EA}{h}=500000,\quad\frac{12EI}{h^3}=12000,\quad
\frac{6EI}{h^2}=12000,\quad\frac{4EI}{h}=16000,\quad\frac{2EI}{h}=8000.$$

Embed the axial and bending matrices in the six-degree-of-freedom ordering:

$$k'_e=
\begin{bmatrix}
500000&0&0&-500000&0&0\\
0&12000&12000&0&-12000&12000\\
0&12000&16000&0&-12000&8000\\
-500000&0&0&500000&0&0\\
0&-12000&-12000&0&12000&-12000\\
0&12000&8000&0&-12000&16000
\end{bmatrix}.$$

Multiplying this matrix by displacements in m and rotations in rad produces alternating force and moment components in kN and kN·m. The entire matrix cannot be assigned a single physical dimension.

## Step 5. Derive Consistent Nodal Loads from Virtual Work

Each element has $q_y=-2\ \mathrm{kN/m}$. For any nodal virtual displacement,

$$\delta W_q=\int_0^h\delta v\,q_y\,dt
=\delta d_b^T\int_0^hH^Tq_y\,dt.$$

The four shape-function integrals are

$$\int_0^hH_1dt=h[\xi-\xi^3+\tfrac12\xi^4]_0^1=h/2,$$

$$\int_0^hH_2dt=h^2[\tfrac12\xi^2-\tfrac23\xi^3+\tfrac14\xi^4]_0^1=h^2/12,$$

$$\int_0^hH_3dt=h[\xi^3-\tfrac12\xi^4]_0^1=h/2,$$

$$\int_0^hH_4dt=h^2[-\tfrac13\xi^3+\tfrac14\xi^4]_0^1=-h^2/12.$$

The load vector for each element is therefore

$$p_e^{0\prime}=
\begin{bmatrix}0\\q_yh/2\\q_yh^2/12\\0\\q_yh/2\\-q_yh^2/12\end{bmatrix}
=\begin{bmatrix}0\\-2\\-2/3\\0\\-2\\2/3\end{bmatrix}.$$

**Check:** The resultant transverse force is $-4\ \mathrm{kN}$. Its moment about the left end is $(-2)(2)-2/3+2/3=-4\ \mathrm{kN\,m}$, equal to the moment of the original uniform load acting through the element midpoint. The virtual-work derivation also ensures consistency beyond these resultant force and moment checks.

## Step 6. Coordinate Transformation and Two-Element Assembly

The single-node rotation matrix and element transformation matrix are

$$R=\begin{bmatrix}0.6&0.8&0\\-0.8&0.6&0\\0&0&1\end{bmatrix},\qquad
T=\begin{bmatrix}R&0\\0&R\end{bmatrix}.$$

They satisfy $d'_e=Td_e$ and $T^TT=I$. Invariance of energy or virtual work gives

$$k_e=T^Tk'_eT,\qquad p_e^0=T^Tp_e^{0\prime}.$$

For example, one entry of the global element stiffness is

$$k_{u_i u_i}=0.6^2(500000)+(-0.8)^2(12000)=187680\ \mathrm{kN/m}.$$

The uniform load becomes the following global nodal vector:

$$p_e^0=[1.6,-1.2,-2/3,\ 1.6,-1.2,2/3]^T.$$

### 6.1 Why can this example be solved in a common local coordinate system?

The elements are collinear and have identical orientations, so all three nodes can use the same rotated coordinate system. Set $\mathcal R=\operatorname{diag}(R,R,R)$. Then

$$\widehat d=\mathcal R d,\quad
\widehat K=\mathcal R K\mathcal R^T,\quad
\widehat P=\mathcal R\bar P.$$

This is an orthogonal change of basis. Solving in this coordinate system and rotating the answer back is equivalent to transforming each element before global assembly. **For a noncollinear frame, element matrices expressed in different local axes cannot simply be added without transformation.**

### 6.2 Assembly at the shared node

In the common coordinate system, the degrees of freedom are ordered as

$$\widehat d=[u'_1,v'_1,\phi_1,u'_2,v'_2,\phi_2,u'_3,v'_3,\phi_3]^T.$$

Element 1 maps to positions $(1,2,3,4,5,6)$, and element 2 maps to $(4,5,6,7,8,9)$. Partition the element stiffness into $3\times3$ nodal blocks:

$$k'_e=\begin{bmatrix}k_{ii}&k_{ij}\\k_{ji}&k_{jj}\end{bmatrix}.$$

The assembled structural matrix is

$$\widehat K=\begin{bmatrix}
k_{ii}&k_{ij}&0\\
k_{ji}&k_{jj}+k_{ii}&k_{ij}\\
0&k_{ji}&k_{jj}
\end{bmatrix}.$$

For example, the diagonal entry for $v'_2$ is $12000+12000=24000$. The coupling between $v'_2$ and $\phi_2$ is $-12000+12000=0$. This cancellation follows from the equal lengths, equal stiffnesses, and collinearity in this example; it cannot be assumed at an arbitrary joint.

### 6.3 Load contributions also add at the shared node

| Node | Axial force from uniform loading (kN) | Transverse force (kN) | Moment (kN·m) |
|---|---:|---:|---:|
| 1 | 0 | −2 | −2/3 |
| 2 | 0 | −4 | $2/3-2/3=0$ |
| 3 | 0 | −2 | +2/3 |

Add the direct load $(6,-8,0)$ at node 3 to obtain

$$\widehat P=[0,-2,-2/3,\ 0,-4,0,\ 6,-10,2/3]^T.$$

Retain the loads at fixed node 1: they are needed when calculating its reactions.

## Step 7. Apply Boundary Conditions and Solve by Hand

Node 1 is fully fixed. The **complete** partitioned equilibrium equation includes the support reactions:

$$\begin{bmatrix}K_{ff}&K_{fc}\\K_{cf}&K_{cc}\end{bmatrix}
\begin{bmatrix}d_f\\d_c\end{bmatrix}
=\begin{bmatrix}\bar P_f\\\bar P_c+R_c\end{bmatrix}.$$

Here $d_c=0$, so solve $K_{ff}d_f=\bar P_f$. In the common coordinate system, the axial and bending equations can be solved separately.

### 7.1 The two axial equations

$$\begin{bmatrix}1000000&-500000\\-500000&500000\end{bmatrix}
\begin{bmatrix}u'_2\\u'_3\end{bmatrix}
=\begin{bmatrix}0\\6\end{bmatrix}.$$

The first equation gives $u'_3=2u'_2$. Substitute into the second:

$$500000(2u'_2-u'_2)=6,$$

$$u'_2=0.000012\ \mathrm m=0.012\ \mathrm{mm},\qquad
u'_3=0.000024\ \mathrm m=0.024\ \mathrm{mm}.$$

### 7.2 The four bending equations

Using the ordering $[v'_2,\phi_2,v'_3,\phi_3]$ gives

$$\begin{bmatrix}
24000&0&-12000&12000\\
0&32000&-12000&8000\\
-12000&-12000&12000&-12000\\
12000&8000&-12000&16000
\end{bmatrix}
\begin{bmatrix}v'_2\\\phi_2\\v'_3\\\phi_3\end{bmatrix}
=\begin{bmatrix}-4\\0\\-10\\2/3\end{bmatrix}.$$

To simplify elimination, let $a,b,c_*,d$ denote the numerical values of $v'_2$ in mm, $\phi_2$ in mrad, $v'_3$ in mm, and $\phi_3$ in mrad, respectively. Each corresponding SI numerical value is $10^{-3}$ times its value in these scaled units. The equations become

$$24a-12c_*+12d=-4,\qquad(1)$$

$$32b-12c_*+8d=0,\qquad(2)$$

$$-12a-12b+12c_*-12d=-10,\qquad(3)$$

$$12a+8b-12c_*+16d=2/3.\qquad(4)$$

From (3), $c_*=a+b+d-5/6$. Substitute into (1):

$$24a-12(a+b+d-5/6)+12d=-4,$$

$$12a-12b+10=-4\quad\Rightarrow\quad a=b-7/6.$$

Substitute into (2):

$$32b-12(a+b+d-5/6)+8d=0,$$

$$-12a+20b-4d+10=0.$$

Then insert $a=b-7/6$ to obtain $8b-4d+24=0$, or $d=2b+6$.

Insert $c_*=a+b+d-5/6$ into (4):

$$12a+8b-12(a+b+d-5/6)+16d=2/3,$$

$$-4b+4d+10=2/3\quad\Rightarrow\quad d-b=-7/3.$$

Combining this with $d=2b+6$ gives

$$b=-25/3,\qquad d=-32/3,\qquad a=-19/2,\qquad c_*=-88/3.$$

The local nodal results are therefore

| Node | $u'$ (mm) | $v'$ (mm) | $\phi$ (mrad) |
|---|---:|---:|---:|
| 1 | 0 | 0 | 0 |
| 2 | +0.012000 | −9.500000 | −8.333333 |
| 3 | +0.024000 | −29.333333 | −10.666667 |

### 7.3 Transform back to global coordinates

$$u=0.6u'-0.8v',\qquad v=0.8u'+0.6v',\qquad\phi=\phi'.$$

For example, at node 3:

$$u_3=0.6(0.024)-0.8(-29.333333)=23.481067\ \mathrm{mm},$$

$$v_3=0.8(0.024)+0.6(-29.333333)=-17.580800\ \mathrm{mm}.$$

| Node | Global $u$ (mm) | Global $v$ (mm) | $\phi$ (mrad) |
|---|---:|---:|---:|
| 1 | 0 | 0 | 0 |
| 2 | +7.607200 | −5.690400 | −8.333333 |
| 3 | +23.481067 | −17.580800 | −10.666667 |

**Physical interpretation:** The free end moves right and down and rotates clockwise, consistent with the loading. The maximum rotation is about $0.0107\ \mathrm{rad}$, and the transverse tip displacement is about $0.73\%$ of the member length. These values are consistent with the small-deformation teaching assumptions used here; they are not a design or capacity assessment of a particular physical member.

## Step 8. Recover the Two Element End-Force Vectors

Use $q'_e=k'_ed'_e-p_e^{0\prime}$. Substitute local translations in m and rotations in rad:

$$d'_1=[0,0,0,\ 0.000012,-0.0095,-0.008333333]^T,$$

$$d'_2=[0.000012,-0.0095,-0.008333333,\ 0.000024,-0.029333333,-0.010666667]^T.$$

Use the exact fractional values from the previous step in the calculation to avoid accumulating rounding from displayed decimals. The first few entries of the element 1 matrix product are

$$ (k'_1d'_1)_1=-500000(0.000012)=-6,$$

$$(k'_1d'_1)_2=-12000(-0.0095)+12000(-0.008333333)=14,$$

$$(k'_1d'_1)_3=-12000(-0.0095)+8000(-0.008333333)=47\tfrac13.$$

The complete product and the result after subtracting the consistent load vector are

$$k'_1d'_1=[-6,14,47\tfrac13,\ 6,-10,-19\tfrac13]^T,$$

$$q'_1=[-6,16,48,\ 6,-12,-20]^T.$$

For element 2, the matrix product for the left-end transverse force, for example, is

$$12000(-0.0095)+12000(-0.008333333)
-12000(-0.029333333)+12000(-0.010666667)=10.$$

The complete results are

$$k'_2d'_2=[-6,10,19\tfrac13,\ 6,-6,2/3]^T,$$

$$q'_2=[-6,12,20,\ 6,-8,0]^T.$$

Entries 1, 2, 4, and 5 of these vectors are in kN; entries 3 and 6 are in kN·m.

**Two checks:** At node 2, the adjacent element end actions add to $(6,-12,-20)+(-6,12,20)=(0,0,0)$, consistent with the absence of a direct nodal load there. At the free end, the end actions are $(6,-8,0)$, exactly matching the direct tip load. Omitting the subtraction of $p^{0\prime}$ would leave an incorrect free-end moment of $2/3\ \mathrm{kN\,m}$.

## Step 9. Calculate the Fixed-End Reactions

From $R=Kd-\bar P$, or equivalently from the left-end actions of element 1 in this example, the local support reactions are

$$R'_{x,1}=-6\ \mathrm{kN},\qquad R'_{y,1}=16\ \mathrm{kN},\qquad M_1=48\ \mathrm{kN\,m}.$$

Transform back to global coordinates:

$$R_{X,1}=0.6(-6)-0.8(16)=-16.4\ \mathrm{kN},$$

$$R_{Y,1}=0.8(-6)+0.6(16)=4.8\ \mathrm{kN},\qquad M_1=48\ \mathrm{kN\,m}.$$

**Global equilibrium checks:** The uniform load has global resultant $(6.4,-4.8)\ \mathrm{kN}$, acting at the full-member midpoint $(1.2,1.6)\ \mathrm m$.

$$\sum F_X=-16.4+10+6.4=0,$$

$$\sum F_Y=4.8-4.8=0,$$

$$\sum M_1=48+(2.4\times0-3.2\times10)
+[1.2(-4.8)-1.6(6.4)]$$

$$=48-32-16=0\ \mathrm{kN\,m}.$$

This check uses the original physical loads and coordinates directly, rather than relying solely on the assembled matrix again.

## Step 10. Recover Section Forces from Equilibrium

Now $x\in[0,4]$ is the local coordinate measured from the fixed end. Substitute its numerical value in m into the following polynomials.

There is no axial distributed load, so $N_{,x}=0$. Since the left-end action is $f_{x1}=-N(0)=-6$,

$$N(x)=6\ \mathrm{kN}.$$

Using $V_{,x}=q_y=-2$ and $V(0)=16$ gives

$$V(x)=16-2x\quad[\mathrm{kN}].$$

Using $M_{,x}=V$ and $M(0)=-m_1=-48$ gives

$$M(x)=-48+\int_0^x(16-2\eta)d\eta
=-48+16x-x^2\quad[\mathrm{kN\,m}].$$

Equivalently,

$$M(x)=-8(4-x)-\frac{2}{2}(4-x)^2.$$

At any section, the bending moment is determined by the tip force and the remaining uniform load to the right of that section.

| $x$（m） | $N$（kN） | $V$（kN） | $M$（kN·m） |
|---:|---:|---:|---:|
| 0 | 6 | 16 | −48 |
| 1 | 6 | 14 | −33 |
| 2 | 6 | 12 | −20 |
| 3 | 6 | 10 | −9 |
| 4 | 6 | 8 | 0 |

The largest bending-moment magnitude is $48\ \mathrm{kN\,m}$ at the fixed end. Note that $V(4^-)=8\ \mathrm{kN}$ is not zero, because the free end carries a concentrated transverse force of $-8\ \mathrm{kN}$. There is no applied tip moment, so $M(4)=0$.

Fiber stress can be calculated from $\sigma_x=N/A-My/I$. However, the problem specifies only $A,I$, not the distance to the extreme fiber, so a maximum fiber stress cannot be reported without additional section information.

# Part III. Analytical Solution, Error, and Energy

## Step 11. Derive the Analytical Displacements Independently

Using the same local sign convention, $EI v''=M$. Here $EI=8000\ \mathrm{kN\,m^2}$, so

$$v''(x)=\frac{-48+16x-x^2}{8000}.$$

Integrate once:

$$\phi(x)=v'(x)=\frac{-48x+8x^2-x^3/3}{8000}+C_1.$$

The fixed-end condition $\phi(0)=0$ gives $C_1=0$. Integrate a second time:

$$v(x)=\frac{-24x^2+(8/3)x^3-x^4/12}{8000}+C_2.$$

The condition $v(0)=0$ gives $C_2=0$. For axial displacement, integrate $du/dx=N/EA$ to obtain

$$u(x)=\frac{6x}{10^6}.$$

At the intermediate node, $x=2$:

$$\phi(2)=\frac{-96+32-8/3}{8000}=-0.008333333\ \mathrm{rad},$$

$$v(2)=\frac{-96+64/3-16/12}{8000}=-0.0095\ \mathrm m.$$

At the tip, $x=4$:

$$\phi(4)=\frac{-192+128-64/3}{8000}=-0.010666667\ \mathrm{rad},$$

$$v(4)=\frac{-384+512/3-256/12}{8000}=-0.029333333\ \mathrm m.$$

These values match the two-element solution to numerical precision. Writing the transverse tip-force magnitude as $P=8\ \mathrm{kN}$ and the uniform-load magnitude as $w=2\ \mathrm{kN/m}$, the same integration gives the reusable formulas

$$v(x)=-\frac{Px^2(3L-x)}{6EI}-\frac{wx^2(6L^2-4Lx+x^2)}{24EI},$$

$$\phi(x)=-\frac{Px(2L-x)}{2EI}-\frac{wx(3L^2-3Lx+x^2)}{6EI},$$

$$v(L)=-\frac{PL^3}{3EI}-\frac{wL^4}{8EI},\qquad
\phi(L)=-\frac{PL^2}{2EI}-\frac{wL^3}{6EI}.$$

## Step 12. Why Does Interior Displacement Error Remain?

The exact $v(x)$ contains a quartic term, while the element's Hermite interpolation $v_h$ is only cubic. For this constant-stiffness beam, consistent loading yields exact nodal displacements and rotations. Each element's discrete field is therefore the cubic Hermite interpolant of the exact solution at its endpoints.

Let $t\in[0,h]$ denote the element coordinate. Both the value and first derivative of the error $e=v-v_h$ vanish at each end, so the quartic error contains the factor $t^2(t-h)^2$. Since $v_h''''=0$ and $v''''=q_y/EI$,

$$e(t)=\frac{q_y}{24EI}t^2(t-h)^2.$$

This also explains nodal exactness. For any cubic test function $z_h$ within an element, its fourth derivative is zero, while $e=e'=0$ at both ends. Integration by parts twice gives $\int EI e''z_h''dt=0$. The Hermite interpolant of the exact solution therefore satisfies the same discrete weak form. Uniqueness of the stable discrete problem identifies it with the finite element solution. This argument relies on constant $EI$ and consistent integration in the present example.

At the element midpoint, $t=h/2$:

$$e(h/2)=\frac{q_yh^4}{384EI}
=\frac{(-2)(2^4)}{384(8000)}=-0.000010416667\ \mathrm m.$$

Thus, the exact displacement is $0.010416667\ \mathrm{mm}$ farther downward than the finite element interpolation. At the first element midpoint, $x=1$, the Hermite coefficients are $(1/2,1/4,1/2,-1/4)$, giving

$$v_h(1)=\frac12(0)+\frac14(0)+\frac12(-0.0095)-\frac14(-0.008333333)
=-0.002666667\ \mathrm m,$$

$$v(1)=\frac{-24+8/3-1/12}{8000}=-0.002677083\ \mathrm m.$$

Their difference is exactly $-0.010416667\ \mathrm{mm}$.

### Mesh-refinement results

| Number of elements | Element length $h$ (m) | Maximum element-midpoint displacement error (mm) |
|---:|---:|---:|
| 1 | 4 | 0.166666667 |
| 2 | 2 | 0.010416667 |
| 4 | 1 | 0.000651042 |
| 8 | 0.5 | 0.000040690 |

The midpoint error in this example is proportional to $h^4$. This special result must not be presented as the convergence rate for every frame, loading condition, or error norm.

## Step 13. Constitutive and Equilibrium-Recovered Moments

Using the cubic coefficient formulas from Step 3, element 1 has

$$a_2=\frac{3(-0.0095)}4-\frac{-0.008333333}{2}=-\frac{71}{24000},$$

$$a_3=-\frac{2(-0.0095)}8+\frac{-0.008333333}{4}=\frac7{24000}.$$

Its discrete displacement field and constitutive bending moment are therefore

$$v_h(x)=-\frac{71}{24000}x^2+\frac7{24000}x^3,$$

$$M_h(x)=-\frac{142}{3}+14x\quad[\mathrm{kN\,m}].$$

The equilibrium-recovered field $M_{\mathrm{eq}}=-48+16x-x^2$ is quadratic. The difference is

$$M_{\mathrm{eq}}-M_h=-\frac23+2x-x^2.$$

At $x=1$, $M_h=-33.333333$ and $M_{\mathrm{eq}}=-33$, a difference of $1/3\ \mathrm{kN\,m}$. This is precisely $EI e''$ and does not indicate failure of nodal equilibrium convergence. This project's $N/V/M$ postprocessing uses equilibrium recovery from end actions and the actual member loads.

## Step 14. Distinguish Discrete and Exact Strain Energy

The prescribed support displacements are zero and the loads increase linearly from zero. The discrete solution satisfies

$$U_h=\frac12d^TKd=\frac12d^T\bar P.$$

Include the nonzero load–displacement products at free degrees of freedom, using kN, m, and rad:

$$2U_h=(-4)(-0.0095)+6(0.000024)+(-10)(-0.029333333)
+\frac23(-0.010666667)$$

$$=0.324366222\ \mathrm{kN\,m},\qquad U_h=162.183111\ \mathrm J.$$

Here $d^T\bar P$ is the bilinear pairing of the final load with the final displacement. For a linear response under proportional loading from zero, the actual external work is half this value. These quantities should not be conflated.

Calculate the strain energy of the exact continuous solution separately:

$$U=\int_0^4\left(\frac{N^2}{2EA}+\frac{M^2}{2EI}\right)dx.$$

The axial contribution is

$$U_a=\frac{6^2(4)}{2(10^6)}=0.000072\ \mathrm{kN\,m}=0.072\ \mathrm J.$$

For bending, expand the square of $M=-48+16x-x^2$:

$$M^2=2304-1536x+352x^2-32x^3+x^4,$$

$$\int_0^4M^2dx=
\left[2304x-768x^2+\frac{352}{3}x^3-8x^4+\frac{x^5}{5}\right]_0^4$$

$$=9216-12288+\frac{22528}{3}-2048+\frac{1024}{5}
=2594.133333.$$

Therefore,

$$U_b=\frac{2594.133333}{16000}=0.162133333\ \mathrm{kN\,m},$$

$$U=162.205333\ \mathrm J,\qquad U-U_h=0.022222222\ \mathrm J.$$

Why do the two energies differ? The finite element field $v_h$ is not the exact continuous displacement field. Galerkin orthogonality holds in this problem, giving

$$U-U_h=\frac12\sum_e\int_0^h EI(e'')^2dt.$$

Starting with $e=\frac{q_y}{24EI}t^2(t-h)^2$ and setting $\xi=t/h$ gives

$$e''=\frac{q_yh^2}{24EI}(12\xi^2-12\xi+2),\qquad
\int_0^1(12\xi^2-12\xi+2)^2d\xi=\frac45.$$

The energy difference for each element is

$$\frac12\int_0^hEI(e'')^2dt=\frac{q_y^2h^5}{1440EI}.$$

For two elements, the total is $2(2^2)(2^5)/(1440\times8000)=0.000022222222\ \mathrm{kN\,m}$, or $0.022222222\ \mathrm J$, matching the difference obtained above.

**Interview point:** Passing the discrete energy identity demonstrates internal consistency of the discrete system. Using the equilibrium-recovered exact resultants in the energy integral evaluates a different field. These two energies need not be equal on a finite mesh.

# Six Variations of the Same Problem

| Change | How to respond or recalculate |
|---|---|
| Double $E$ | Displacements and rotations halve. Reactions and internal forces remain unchanged because this is a statically determinate cantilever. In an indeterminate structure, changing only some member stiffnesses can redistribute internal forces. |
| Double $I$ | Local bending displacements and rotations halve; axial displacement is unchanged. Recombine the axial and transverse components to obtain global displacements. |
| Remove the uniform load | Remove $p^0$ and the distributed-load terms in force recovery. For this constant-stiffness cantilever under tip forces, the exact transverse displacement is cubic, so one standard beam element can represent the full displacement field. |
| Replace the uniform load with global vertical $q_Y=-2$ kN/m | Transform it first: $q_{x'}=0.8(-2)=-1.6$ and $q_{y'}=0.6(-2)=-1.2$ kN/m. Axial force is no longer constant, so the original load vector cannot be reused. The intensity is still measured per actual member length. |
| Insert an internal hinge at node 2 | Rotational compatibility and moment transfer change. Check for a mechanism first. A complete moment release at the midpoint allows the outer segment to rotate rigidly about the hinge; the specified loading has no stable linear static solution. |
| Add a roller at node 3 that restrains global vertical displacement | Add the constraint $v_3=0$. The structure becomes statically indeterminate. Repartition and solve the system; do not adjust the original cantilever reaction table by inspection. |

# Oral Practice and Self-Assessment

**A one-minute project introduction:**

“My project is a two-dimensional, linearly elastic Euler–Bernoulli frame solver for small-deformation static analysis. Starting from nodal displacements and rotations, I construct the displacement fields with shape functions and derive the element stiffness from strain energy. I use virtual-work invariance for coordinate transformation, assemble the global system, and apply the support conditions. After solving for displacement, I recover reactions and section forces. I distinguish constitutive forces obtained by differentiating displacement from equilibrium-recovered forces obtained from end actions and member loads. I verify the results using analytical solutions, global equilibrium, and mesh refinement. The current model is linear static; nonlinear and stability analyses require additional kinematic formulations and consistent tangents.”

**Three rounds of self-assessment:**

1. Without reading the guide, explain the mathematical sequence in 60 seconds. Add one sentence of physical interpretation for each equation you mention.
2. Spend 20–30 minutes redoing the load transformation, constrained matrix, elimination, end-force recovery, and reactions. Memorizing all 36 matrix entries is not the goal.
3. Spend 10 minutes answering Q18, Q20, and the energy-difference question. This round checks whether you understand the limitations of the finite element approximation.

# Sources and Verification Record

This guide is based primarily on the local mathematical notes and solver implementation. The worked problem was designed separately and calculated independently. The code paths below are relative to the project root:

| Topic | Local source |
|---|---|
| Assumptions, formulas, and signs | [Mathematical basis document](../../Math%20Logic/2D_Frame_%E6%9C%89%E9%99%90%E5%85%83%E7%B4%A0%E6%95%B8%E5%AD%B8%E4%BE%9D%E6%93%9A.md) in `Math Logic/` |
| Local frame stiffness | `src/frame2d/stiffness.py` |
| Displacement and force transformation | `src/frame2d/transformation.py` |
| Degrees of freedom and assembly | `src/frame2d/assembly.py` |
| Consistent nodal loads | `src/frame2d/loads.py` |
| Constraints and solution | `src/frame2d/solution.py`, `src/frame2d/solver.py` |
| End actions and section forces | `src/frame2d/recovery.py`, `src/frame2d/postprocessing.py` |

For an external teaching reference on the standard displacement-based Euler–Bernoulli weak form, Hermite interpolation, and continuity, see [TU Delft: Euler–Bernoulli beam elements](https://interactivetextbooks.citg.tudelft.nl/computational-modelling/structural_linear/euler_bernouilli.html). Its bending-moment convention may differ from this project's. All end-force mappings and calculations in this guide use the local conventions defined above.

**Numerical verification (2026-09-10):** The existing solver was run with 1, 2, 4, and 8 elements. All nodal displacements were compared with the analytical solution; support reactions, sampled section forces, and element equilibrium were also checked. An independent reduced matrix verified the hand elimination, and analytical polynomial integration verified the energy difference. All checks passed. They establish consistency of the formulas and results for this example, not comprehensive verification of every problem or software capability.
