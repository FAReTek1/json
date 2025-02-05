# use the Result struct for compatability with the decoder
# It means you input a type and a value
func encode(Result r) {
    if $r.type == "object" {
        # All contents of the input object should already be JSON escaped
        local ret = "{";
        local i = 1;
        repeat length keys {
            ret &= keys[i] & ": " & values[i];
            if i < length keys {
                ret &= ", ";
            }
            i++;
        }

        ret &= "}";
        return ret;
        
    } elif $r.type == "array" {
        # All contents of the input array should already be JSON escaped
        local ret = "[";
        local i = 1;
        # Using the same list 'arr' as the decoder
        repeat length arr {
            ret &= arr[i];
            if i < length arr {
                ret &= ", ";
            }
            i++;
        }
        ret &= "]";
        return ret;

    } else {
        return encode_value($r);
    }
        
}

func encode_string(s) {
    local i = 1;
    local ret = "\"";
    
    repeat length $s {
        if $s[i] == "\"" {
            ret &= "\\\"";
        } elif $s[i] == "\\" {
            ret &= "\\\\";
        # } elif $s[i] == "/" {
        #     # Solidus doesn't actually NEED to be escaped
        #     ret &= "\\/";
        # \f causes bugs, so I will skip it
        # Not sure if scratch can even detect \n
        } elif $s[i] == "\n" {
            ret &= "\\n";
        } elif $s[i] == "\r" {
            ret &= "\\r";
        # Strangely, scratch equates \t with 0, but you can bypass this using the contains block
        } elif $s[i] == "\t" and $s[i] in "\t"{
            ret &= "\\t";
        } else {
            ret &= $s[i];
        }
        # You do not need to encode unicode 

        i++;
    }

    return ret & "\"";
}

func encode_value(Result r) {
    if $r.type == "string" {
        return encode_string($r.value);

    } elif $r.type == "number" {
        return $r.value; # scratch internally uses the JS object notation anyways

    } elif $r.type == "true" {
        return "true";

    } elif $r.type == "false" {
        return "false";
        
    } elif $r.type == "null" {
        return "null";
    }
}