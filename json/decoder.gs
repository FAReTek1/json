# The JSON library is only designed to parse 1 JSON string at a time. Hence the use of many globabl vars.
# The variables may also cause naming conflicts. 
# This will be solved by goboscript's future support for namespaces.
# There will NOT be rigorous JSON validation (but they may be some), and it may be added in th future

list keys;
list values;
list arr;

struct Result {
    type, # Using same type names as json.org for consistency
    value
}

func decode(json) Result {
    return decode_value(1, $json);
}

func decode_value(i, json) Result {
    local type = eval_type($json);

    i = $i; # NOT local

    if type == "string" {
        local value = decode_string($json);
    } 

    elif type == "number" {
        local value = decode_number($json);
    }

    elif type == "array" {
        local value = "<See arr list>";
        decode_array $json;
    }

    elif type == "object" {
        local value = "<See key list and values list>";
        decode_object $json;
    }

    elif type == "true" {
        local value = true;
        i += 4;
    }

    elif type == "false" {
        local value = false;
        i += 5;
    }

    elif type == "null" {
        local value = "null";
        i += 4;
    }

    return Result{
        type: type,
        value: value
    };
}

func eval_type(json) {
    # For now, assume that JSON is valid
    if startswith($json, "true") or startswith($json, "false") or startswith($json, "null") {
        return $json;
    }
    elif $json[1] == "\"" {
        return "string";
    }
    elif $json[1] == "[" {
        return "array";
    }
    elif $json[1] == "{" {
        return "object";
    }
    else {
        return "number";
    }
}

func decode_string(json) {
    # https://www.json.org/json-en.html#:~:text=A%20string%20is%20a%20sequence%20of%20zero%20or%20more%20Unicode%20characters%2C%20wrapped%20in%20double%20quotes%2C%20using%20backslash%20escapes.%20A%20character%20is%20represented%20as%20a%20single%20character%20string.%20A%20string%20is%20very%20much%20like%20a%20C%20or%20Java%20string.
    
    i++; # skip first char
    local ret = "";

    until $json[i] == "\"" {
        if $json[i] == "\\" {
            # escaped chars
            next = $json[i + 1];
            if next == "\""{
                ret &= "\"";
                i += 2;

            } elif next == "\\" {
                ret &= "\\";
                i += 2;
            
            } elif next == "/" {
                ret &= "/";
                i += 2;

            } elif next == "b" {
                # not exactly sure how to implement
                ret = slice(ret, 1, length ret - 1);
                i += 2;

            # These ones can't really be done in scratch :\
            # You would have to output the string as an array of tokens, which is kinda dumb
            } elif next == "f" {
                ret &= "";
                i += 2;

            } elif next == "n" {
                ret &= "\n";
                i += 2;
            
            } elif next == "r" {
                ret &= "\r";
                i += 2;
            
            } elif next == "t" {
                ret &= "\t";
                i += 2;
            
            } elif next == "u" {
                local hex = slice($json, i + 2, i + 5);
                # Convert hex to decimal
                hex = HEX(hex);

                ret &= unicode[hex];

                i += 2 + 4;

            } else {
                # To avoid warp error, return sth
                return "ERROR - invalid escape char @idx" & i;
            }

        } else {
            ret &= $json[i];
            i++;
        }
    }

    return ret;
}

func decode_number(json) {
    local ret = "";
    if $json[i] == "-" {
        ret &= "-";
        i++;
    }

    if $json[i] == "0" {
        ret &= "0";
        i++;

    } elif $json[i] in "123456789" {
        until $json[i] not in "0123456789" or i > length $json {
            ret &= $json[i];
            i++;
        }
    } else {
        return "NaN";
    }

    # fraction
    if $json[i] == "." {
        ret &= ".";
        i++;

        until $json[i] not in "0123456789" or i > length $json {
            ret &= $json[i];
            i++;
        }
    }

    # exponent
    if $json[i] == "e" {
        # ^^ Scratch is not case sensitive; this also detects "E"
        ret &= $json[i];
        i++;

        if $json[i] == "-" {
            ret &= "-";
            i++;

        } elif $json[i] == "+" {
            ret &= "+";
            i++;
        
        } elif $json[i] not in "0123456789" {
            return "NaN"; # If there is no + or -, there must be a digit next.
        }
        # We can assume there will be a digit now, due to the check above ^^
        ret &= $json[i];
        i++;
        
        until $json[i] not in "0123456789" or i > length $json {
            ret &= $json[i];
            i++;
        }
    }

    return ret;
}

proc decode_array json {
    delete arr;
    i++;

    local ret = "";
    local level = 1;
    local last_level1_arr = 0;
    local latest_bracket = "[";

    until i > length $json or level == 0 {
        skip_whitespace $json;
        local prev_i = i;
        
        if $json[i] in "{[" {
            latest_bracket = $json[i] & latest_bracket;
            if level == 1 {
                last_level1_arr = i;
            }
            level++;
            i++;

        } elif $json[i] in "}]" {
            latest_bracket = slice(latest_bracket, 2, length latest_bracket);
            level--;
            if level == 1 {
                add slice($json, last_level1_arr, i) to arr;
                last_level1_arr = 0;
            }
            i++;
        
        } elif $json[i] == "\"" {
            skip_string $json;
            if level == 1 {
                add slice($json, prev_i, i - 1) to arr;
            }
        
        } elif $json[i] in "-0123456789" {
            skip_number $json;
            if level == 1 {
                add slice($json, prev_i, i - 1) to arr;
            }
        
        } elif startswith_from_idx($json, "true", i) {
            i += 4;
            if level == 1 {
                add "true" to arr;
            }
            
        } elif startswith_from_idx($json, "false", i) {
            i += 5;
            if level == 1 {
                add "true" to arr;
            }

        } elif startswith_from_idx($json, "null", i) {
            i += 4;
            if level == 1 {
                add "null" to arr;
            }
        }

        if latest_bracket[1] == "{" {
            if $json[i] == ":" {
                ret &= ":";
                i++;
            }
        }

        if $json[i] == "," {
            ret &= ",";
            i++;
        }
    }
}

proc add_to_kv kv, val {
    if $kv == "k" {
        add $val to keys;
    } else {
        add $val to values;
    }
}

proc decode_object json {
    delete keys;
    delete values;

    i++;

    local ret = "";
    local level = 1;
    local last_level1_arr = 0;
    local latest_bracket = "{";
    local kv = "k";

    until i > length $json or level == 0 {
        skip_whitespace $json;
        local prev_i = i;
        
        if $json[i] in "{[" {
            latest_bracket = $json[i] & latest_bracket;
            if level == 1 {
                last_level1_arr = i;
            }
            level++;
            i++;

        } elif $json[i] in "}]" {
            latest_bracket = slice(latest_bracket, 2, length latest_bracket);
            level--;
            if level == 1 {
                add_to_kv kv, slice($json, last_level1_arr, i);
                last_level1_arr = 0;
            }
            i++;
        
        
        } elif $json[i] == "\"" {
            skip_string $json;
            if level == 1 {
                add_to_kv kv, slice($json, prev_i, i - 1);
            }
        
        } elif $json[i] in "-0123456789" {
            skip_number $json;
            if level == 1 {
                add_to_kv kv, slice($json, prev_i, i - 1);
            }
        
        } elif startswith_from_idx($json, "true", i) {
            i += 4;
            if level == 1 {
                add_to_kv kv, "true";
            }
            
        } elif startswith_from_idx($json, "false", i) {
            i += 5;
            if level == 1 {
                add_to_kv kv, "true";
            }

        } elif startswith_from_idx($json, "null", i) {
            i += 4;
            if level == 1 {
                add_to_kv kv, "null";
            }
        }

        if latest_bracket[1] == "{" {
            if $json[i] == ":" {
                if level == 1 {
                    kv = "v";
                }
                ret &= ":";
                i++;
            }
        }

        if $json[i] == "," {
            if level == 1{
                kv = "k";
            }
            ret &= ",";
            i++;
        }
    }
}


proc skip_whitespace json {
    until $json[i] not in " \t\n\r" or i > length $json {
        i++;
    }
}

proc skip_string json {
    i++;

    until $json[i] == "\"" {
        if $json[i] == "\\" {
            i++;
            next = $json[i];
            if next in "\"\\/bfnrt" {
                i++;
            } elif next == "u" {
                i += 5;
            } # else {
                # error
            # }
        } else {
            i++;
        }
    }
    i++;
}

proc skip_number json {
    if $json[i] == "-" {
        i++;
    }

    if $json[i] == "0" {
        i++;

    } elif $json[i] in "123456789" {
        until $json[i] not in "0123456789" or i > length $json {
            i++;
        }
    } else {
        return "NaN";
    }

    # fraction
    if $json[i] == "." {
        i++;

        until $json[i] not in "0123456789" or i > length $json {
            i++;
        }
    }

    # exponent
    if $json[i] == "e" {
        # ^^ Scratch is not case sensitive; this also detects "E"
        i++;

        if $json[i] == "-" {
            i++;

        } elif $json[i] == "+" {
            i++;
        
        } # elif $json[i] not in "0123456789" {
            # If there is no + or -, there must be a digit next.
        # }
        # We can assume there will be a digit now, due to the check above ^^
        i++;
        
        until $json[i] not in "0123456789" or i > length $json {
            i++;
        }
    }
}
