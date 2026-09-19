"""Linear elastic 3D frame core (A00–A03); no web or database dependency."""

from .models import Node, FrameElement, Support, NodalLoad, DistributedLoad, SectionPoint
from .geometry import ElementGeometry, calculate_geometry
from .stiffness import calculate_local_stiffness
from .transformation import (calculate_transformation, calculate_global_stiffness,
                             calculate_global_equivalent_nodal_load)
from .assembly import (calculate_node_dof_map, calculate_element_dof_map,
                       assemble_global_stiffness, assemble_nodal_load_vector,
                       assemble_equivalent_nodal_load_vector)
from .loads import calculate_local_equivalent_nodal_load
from .releases import CondensedElement, condense_releases
from .solution import (partition_dofs, assemble_support_transformation,
                       assemble_prescribed_displacement_vector, solve_displacements,
                       calculate_reaction_vector)
from .recovery import (ElementEndResponse, extract_element_displacements,
                       recover_local_displacements, recover_local_end_forces,
                       recover_element_end_response)
from .postprocessing import (ElementFieldResults, ElementEquilibriumValidation,
                             calculate_normal_stress, reshape_nodal_displacements)
from .solver import FrameAnalysisResult, ElementAnalysisResult, GlobalValidation, solve_frame

__all__ = [
    "Node", "FrameElement", "Support", "NodalLoad", "DistributedLoad", "SectionPoint",
    "ElementGeometry", "calculate_geometry", "calculate_local_stiffness",
    "calculate_transformation", "calculate_global_stiffness", "calculate_global_equivalent_nodal_load",
    "calculate_node_dof_map", "calculate_element_dof_map", "assemble_global_stiffness",
    "assemble_nodal_load_vector", "assemble_equivalent_nodal_load_vector",
    "calculate_local_equivalent_nodal_load", "CondensedElement", "condense_releases",
    "partition_dofs", "assemble_support_transformation", "assemble_prescribed_displacement_vector",
    "solve_displacements", "calculate_reaction_vector", "ElementEndResponse",
    "extract_element_displacements", "recover_local_displacements", "recover_local_end_forces",
    "recover_element_end_response", "ElementFieldResults", "ElementEquilibriumValidation",
    "calculate_normal_stress", "reshape_nodal_displacements", "FrameAnalysisResult",
    "ElementAnalysisResult", "GlobalValidation", "solve_frame",
]
