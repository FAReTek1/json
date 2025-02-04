# Include the json package from within the backpack folder within the workdir directory
# i.e., the JSON package is located @ workdir/backpack/json

# This reduces the number of times that the project has to be (pre-)released on github, 
# smoothening the workflow

# Remember, for some reason, preprocessor directives seem to have to be split by newlines

################################################################
# dependencies

%include backpack/std/std.gs

################################################################

%include backpack/json/json/decoder

%include backpack/json/json/encoder
