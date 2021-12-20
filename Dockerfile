FROM emscripten/emsdk:3.0.1

RUN set -xe; \
    wget https://boostorg.jfrog.io/artifactory/main/release/1.76.0/source/boost_1_76_0.tar.gz -O /opt/boost.tar.gz; \
    echo "7bd7ddceec1a1dfdcbdb3e609b60d01739c38390a5f956385a12f3122049f0ca /opt/boost.tar.gz" | sha256sum --check;
