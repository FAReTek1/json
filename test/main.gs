%include backpack/json

costumes "blank.svg";

onflag {
    Result r = decode("[1, \"hello \\\\_(:\\\\)_\\/\", 3, 4, true, false, null,  [true, false, null, {true: \"nah\"}], {true: \"nah\"}]");
    say r.type & ": " & r.value;
}