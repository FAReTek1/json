# json.gs
This is a JSON decode/encoder library which is built for [goboscript](https://github.com/aspizu/goboscript).
It is designed to be used with [backpack](https://github.com/aspizu/backpack)

<!-- > [!WARNING]
> The json package uses certain global variable names such as `i`, which are likely to cause naming conflicts. This may be fixed later, or when namespaces are added to goboscript. -->
<!-- The variable name issue is resolved -->

## Installation
To use this, make sure to install [backpack](https://github.com/aspizu/backpack)

You can use the json library by adding these lines to goboscript.toml:
```toml
[dependencies]
json = "https://github.com/FAReTek1/json@<the version you want to use>"
```

Then, add this %include to your gs file:
you can also use this to just %include everything
```rs
%include backpack/json
```