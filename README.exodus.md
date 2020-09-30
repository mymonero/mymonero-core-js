## Upgrade submodules

```
bin/update_submodules   // only support master branch
```

## Build

> In order to create an deterministic build, we're using docker.

### 1. Install Docker

For macOS, download it at https://hub.docker.com/editions/community/docker-ce-desktop-mac

### 2. Prepare repo

```shell
# Clone repo and submodules
git clone --recursive git@github.com:ExodusMovement/mymonero-core-js.git

# Prepare boost source code
curl -LO https://dl.bintray.com/boostorg/release/1.69.0/source/boost_1_69_0.tar.gz
shasum -a 256 boost_1_69_0.tar.gz # should be 9a2c2819310839ea373f42d69e733c339b4e9a19deab6bfec448281554aa4dbb, per https://www.boost.org/users/history/version_1_69_0.html
mkdir -p contrib/boost-sdk
tar zxf boost_1_69_0.tar.gz -C contrib/boost-sdk --strip-components=1
```

### 3. Build emscripten

```shell
# Fetch changes
git pull
git submodule update

# Clean up old build files
rm -rf build && mkdir build
rm monero_utils/MyMoneroCoreCpp_*

# Build boost emscripten
docker run -it -v $(pwd):/app quay.io/exodusmovement/emscripten:1.38.48 ./bin/build-boost-emscripten.sh

# Build MyMonero emscripten
docker run -it -v $(pwd):/app quay.io/exodusmovement/emscripten:1.38.48 ./bin/archive-emcpp.sh

# If you get '#error Including <emscripten/bind.h> requires building with -std=c++11 or newer!' error, re-run:

docker run -it -v $(pwd):/app quay.io/exodusmovement/emscripten:1.38.48 ./bin/archive-emcpp.sh
```

# Other Notes

The `quay.io/exodusmovement/emscripten` image was built by Quay.io
See instructions at https://github.com/ExodusMovement/docker-emscripten
