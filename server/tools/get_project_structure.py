import os
import json

def get_directory_structure(root_dir):
    def traverse_directory(directory):
        structure = {"files": {}, "directories": {}}
        
        for item in os.listdir(directory):
            item_path = os.path.join(directory, item)
            
            if os.path.isfile(item_path):
                if item == "pnpm-lock.yaml" or item == ".env.vault" or item == "README.md":
                    continue
                with open(item_path, "r", encoding="utf-8", errors="ignore") as file:
                    structure["files"][item] = file.read()
            elif os.path.isdir(item_path):
                structure["directories"][item] = traverse_directory(item_path)
        
        return structure
    
    return {os.path.basename(root_dir): traverse_directory(root_dir)}

if __name__ == "__main__":
    project_root = "../full-stack-nextjs"
    project_structure = get_directory_structure(project_root)
    
    with open("project_structure.json", "w", encoding="utf-8") as json_file:
        json.dump(project_structure, json_file, indent=2)
    
    print("Project structure saved to project_structure.json")