
import gzip
import json


def get_base_repo():
    # read project_structure.json file
    with open("project_structure.json", "r") as file:
        project_structure = json.load(file)
        return project_structure
        