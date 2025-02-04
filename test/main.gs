%include backpack/json

costumes "blank.svg";

onflag {
    Result r = decode("-1.245e12");
    say r.type & ": " & r.value;
}