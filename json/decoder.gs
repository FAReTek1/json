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

    json_decode_index = $i; # NOT local

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
        json_decode_index += 4;
    }

    elif type == "false" {
        local value = false;
        json_decode_index += 5;
    }

    elif type == "null" {
        local value = "null";
        json_decode_index += 4;
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
    
    json_decode_index++; # skip first char
    local ret = "";

    until $json[json_decode_index] == "\"" {
        if $json[json_decode_index] == "\\" {
            # escaped chars
            local next = $json[json_decode_index + 1];
            if next == "\""{
                ret &= "\"";
                json_decode_index += 2;

            } elif next == "\\" {
                ret &= "\\";
                json_decode_index += 2;
            
            } elif next == "/" {
                ret &= "/";
                json_decode_index += 2;

            } elif next == "b" {
                # not exactly sure how to implement
                ret = slice(ret, 1, length ret - 1);
                json_decode_index += 2;

            # These ones can't really be done in scratch :\
            # You would have to output the string as an array of tokens, which is kinda dumb
            } elif next == "f" {
                ret &= "";
                json_decode_index += 2;

            } elif next == "n" {
                ret &= "\n";
                json_decode_index += 2;
            
            } elif next == "r" {
                ret &= "\r";
                json_decode_index += 2;
            
            } elif next == "t" {
                ret &= "\t";
                json_decode_index += 2;
            
            } elif next == "u" {
                local hex = slice($json, json_decode_index + 2, json_decode_index + 5);
                # Convert hex to decimal
                hex = HEX(hex);

                ret &= unicode[hex];

                json_decode_index += 2 + 4;

            } else {
                # To avoid warp error, return sth
                return "ERROR - invalid escape char @idx" & json_decode_index;
            }

        } else {
            ret &= $json[json_decode_index];
            json_decode_index++;
        }
    }

    return ret;
}

func decode_number(json) {
    local ret = "";
    if $json[json_decode_index] == "-" {
        ret &= "-";
        json_decode_index++;
    }

    if $json[json_decode_index] == "0" {
        ret &= "0";
        json_decode_index++;

    } elif $json[json_decode_index] in "123456789" {
        until $json[json_decode_index] not in "0123456789" or json_decode_index > length $json {
            ret &= $json[json_decode_index];
            json_decode_index++;
        }
    } else {
        return "NaN";
    }

    # fraction
    if $json[json_decode_index] == "." {
        ret &= ".";
        json_decode_index++;

        until $json[json_decode_index] not in "0123456789" or json_decode_index > length $json {
            ret &= $json[json_decode_index];
            json_decode_index++;
        }
    }

    # exponent
    if $json[json_decode_index] == "e" {
        # ^^ Scratch is not case sensitive; this also detects "E"
        ret &= $json[json_decode_index];
        json_decode_index++;

        if $json[json_decode_index] == "-" {
            ret &= "-";
            json_decode_index++;

        } elif $json[json_decode_index] == "+" {
            ret &= "+";
            json_decode_index++;
        
        } elif $json[json_decode_index] not in "0123456789" {
            return "NaN"; # If there is no + or -, there must be a digit next.
        }
        # We can assume there will be a digit now, due to the check above ^^
        ret &= $json[json_decode_index];
        json_decode_index++;
        
        until $json[json_decode_index] not in "0123456789" or json_decode_index > length $json {
            ret &= $json[json_decode_index];
            json_decode_index++;
        }
    }

    return ret;
}

proc decode_array json {
    delete arr;
    json_decode_index++;

    local ret = "";
    local level = 1;
    local last_level1_arr = 0;
    local latest_bracket = "[";

    until json_decode_index > length $json or level == 0 {
        skip_whitespace $json;
        local prev_i = json_decode_index;
        
        if $json[json_decode_index] in "{[" {
            latest_bracket = $json[json_decode_index] & latest_bracket;
            if level == 1 {
                last_level1_arr = json_decode_index;
            }
            level++;
            json_decode_index++;

        } elif $json[json_decode_index] in "}]" {
            latest_bracket = slice(latest_bracket, 2, length latest_bracket);
            level--;
            if level == 1 {
                add slice($json, last_level1_arr, json_decode_index) to arr;
                last_level1_arr = 0;
            }
            json_decode_index++;
        
        } elif $json[json_decode_index] == "\"" {
            skip_string $json;
            if level == 1 {
                add slice($json, prev_i, json_decode_index - 1) to arr;
            }
        
        } elif $json[json_decode_index] in "-0123456789" {
            skip_number $json;
            if level == 1 {
                add slice($json, prev_i, json_decode_index - 1) to arr;
            }
        
        } elif startswith_from_idx($json, "true", json_decode_index) {
            json_decode_index += 4;
            if level == 1 {
                add "true" to arr;
            }
            
        } elif startswith_from_idx($json, "false", json_decode_index) {
            json_decode_index += 5;
            if level == 1 {
                add "true" to arr;
            }

        } elif startswith_from_idx($json, "null", json_decode_index) {
            json_decode_index += 4;
            if level == 1 {
                add "null" to arr;
            }
        }

        if latest_bracket[1] == "{" {
            if $json[json_decode_index] == ":" {
                ret &= ":";
                json_decode_index++;
            }
        }

        if $json[json_decode_index] == "," {
            ret &= ",";
            json_decode_index++;
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

    json_decode_index++;

    local ret = "";
    local level = 1;
    local last_level1_arr = 0;
    local latest_bracket = "{";
    local kv = "k";

    until json_decode_index > length $json or level == 0 {
        skip_whitespace $json;
        local prev_i = json_decode_index;
        
        if $json[json_decode_index] in "{[" {
            latest_bracket = $json[json_decode_index] & latest_bracket;
            if level == 1 {
                last_level1_arr = json_decode_index;
            }
            level++;
            json_decode_index++;

        } elif $json[json_decode_index] in "}]" {
            latest_bracket = slice(latest_bracket, 2, length latest_bracket);
            level--;
            if level == 1 {
                add_to_kv kv, slice($json, last_level1_arr, json_decode_index);
                last_level1_arr = 0;
            }
            json_decode_index++;
        
        
        } elif $json[json_decode_index] == "\"" {
            skip_string $json;
            if level == 1 {
                add_to_kv kv, slice($json, prev_i, json_decode_index - 1);
            }
        
        } elif $json[json_decode_index] in "-0123456789" {
            skip_number $json;
            if level == 1 {
                add_to_kv kv, slice($json, prev_i, json_decode_index - 1);
            }
        
        } elif startswith_from_idx($json, "true", json_decode_index) {
            json_decode_index += 4;
            if level == 1 {
                add_to_kv kv, "true";
            }
            
        } elif startswith_from_idx($json, "false", json_decode_index) {
            json_decode_index += 5;
            if level == 1 {
                add_to_kv kv, "true";
            }

        } elif startswith_from_idx($json, "null", json_decode_index) {
            json_decode_index += 4;
            if level == 1 {
                add_to_kv kv, "null";
            }
        }

        if latest_bracket[1] == "{" {
            if $json[json_decode_index] == ":" {
                if level == 1 {
                    kv = "v";
                }
                ret &= ":";
                json_decode_index++;
            }
        }

        if $json[json_decode_index] == "," {
            if level == 1{
                kv = "k";
            }
            ret &= ",";
            json_decode_index++;
        }
    }
}


proc skip_whitespace json {
    until $json[json_decode_index] not in " \t\n\r" or json_decode_index > length $json {
        json_decode_index++;
    }
}

proc skip_string json {
    json_decode_index++;

    until $json[json_decode_index] == "\"" {
        if $json[json_decode_index] == "\\" {
            json_decode_index++;
            local next = $json[json_decode_index];
            if next in "\"\\/bfnrt" {
                json_decode_index++;
            } elif next == "u" {
                json_decode_index += 5;
            } # else {
                # error
            # }
        } else {
            json_decode_index++;
        }
    }
    json_decode_index++;
}

proc skip_number json {
    if $json[json_decode_index] == "-" {
        json_decode_index++;
    }

    if $json[json_decode_index] == "0" {
        json_decode_index++;

    } elif $json[json_decode_index] in "123456789" {
        until $json[json_decode_index] not in "0123456789" or json_decode_index > length $json {
            json_decode_index++;
        }
    } else {
        return "NaN";
    }

    # fraction
    if $json[json_decode_index] == "." {
        json_decode_index++;

        until $json[json_decode_index] not in "0123456789" or json_decode_index > length $json {
            json_decode_index++;
        }
    }

    # exponent
    if $json[json_decode_index] == "e" {
        # ^^ Scratch is not case sensitive; this also detects "E"
        json_decode_index++;

        if $json[json_decode_index] == "-" {
            json_decode_index++;

        } elif $json[json_decode_index] == "+" {
            json_decode_index++;
        
        } # elif $json[json_decode_index] not in "0123456789" {
            # This causes error
        # }
        # We can assume there will be a digit now, due to the check above ^^
        json_decode_index++;
        
        until $json[json_decode_index] not in "0123456789" or json_decode_index > length $json {
            json_decode_index++;
        }
    }
}
