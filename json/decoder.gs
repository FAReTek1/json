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

    i = $i;

    if type == "string" {
        local value = decode_string($json);
    } 
    elif type == "number" {
        local value = decode_number($json);
    }

    return Result{
        type: type,
        value: value
    };
}

func eval_type(json) {
    # For now, assume that JSON is valid
    if $json == "true" or $json == "false" or $json == "null" {
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
