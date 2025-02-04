"""
This is a utility script for use when making goboscript packages that copy+pastes the package into the test/backpack folder 
It also updates goboscript.toml with the dependecies from test/goboscript.toml.
"""

import os
import argparse
import shutil
import tomllib

from colorama import Fore as f # type: ignore
from colorama import Style as s # type: ignore

################################################################
# CLI stuff (really neat!!)
# https://stackoverflow.com/questions/4033723/how-do-i-access-command-line-arguments
parser = argparse.ArgumentParser("python autogen.py")
parser.add_argument("-toml", help="Whether to update the goboscript.toml file", action="store_true")
args = parser.parse_args()

################################################################

path = __file__

print(f"Running: {f.CYAN}{s.BRIGHT}{path}{f.RESET}{s.NORMAL}")

split = path.split('\\')
project_name = split[-3]
project_dir = '\\'.join(split[:-2])
package_dir = os.path.join(project_dir, project_name)

print(f"Cloning with project dir: {s.BRIGHT}{f.CYAN}{project_dir}{f.RESET}{s.NORMAL}")

################################################################
# Copy over package into backpack

backpack_dir = os.path.join(project_dir, "test", "backpack", project_name)

print(f"Copying into backpack: {s.BRIGHT}{f.CYAN}{backpack_dir}{f.RESET}{s.NORMAL}")
print(f"Copying package from: {s.BRIGHT}{f.CYAN}{package_dir}{f.RESET}{s.NORMAL}")

shutil.rmtree(backpack_dir, ignore_errors=True)
shutil.copytree(package_dir, os.path.join(backpack_dir, project_name))

shutil.copyfile(os.path.join(project_dir, f"{project_name}.gs"), 
                os.path.join(backpack_dir, f"{project_name}.gs"))

################################################################
# Copy over goboscript.toml into main
if args.toml:
    print(f"{s.BRIGHT}{f.YELLOW}Updating goboscript.toml{f.RESET}{s.NORMAL}")

    with open(os.path.join(project_dir, "test", "goboscript.toml"), "rb") as toml_file:
        toml = tomllib.load(toml_file)

    dependencies = toml["dependencies"]
    true_deps = {}

    for name, url in dependencies.items():
        if name != project_name:
            true_deps[name] = url

    # Tomllib does not have a write function
    with open(os.path.join(project_dir, "goboscript.toml"), "w") as toml_file:
        toml_file.write("[dependencies]\n")
        for name, url in true_deps.items():
            toml_file.write(f"{name} = \"{url}\"\n")

################################################################

print(f"{s.BRIGHT}{f.GREEN}Completed{s.NORMAL}{f.RESET}\n")
