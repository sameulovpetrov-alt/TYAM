cmake_minimum_required(VERSION 3.16)
project(krai_survival LANGUAGES CXX)

add_executable(krai-survival src/main.cpp)
target_compile_features(krai-survival PRIVATE cxx_std_17)
target_compile_options(krai-survival PRIVATE -Wall -Wextra -Wpedantic)
