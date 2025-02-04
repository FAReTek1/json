%include backpack/json

costumes "blank.svg";

onflag {
    ask "";
    Result r = decode(answer());
    say r.type & ": " & r.value;

    say encode(r);
}