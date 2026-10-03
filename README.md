# urlpack
Pack (small) web applications and all of their assets into data urls

## Build project
Clone this repository, install dependencies via
```sh
deno i
```
Once that is done, you can build your project into a data url!
Example:
```sh
deno run --allow-all ./build.ts ./examples/perlin_noise/src/index.ts
```
It will output the built data url to stdout.