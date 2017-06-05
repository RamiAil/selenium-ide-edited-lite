##### prerequisites: subversion, openjdk-7-jdk, python, wget #####

# build

## checkout selenium source code
cd ~/workspace/selenium/

## clean
./go clean

## csharp formatter
./go //ide/plugins/csharp-format:csharp-format
### artifact: build/ide/plugins/csharp-format/csharp-format.xpi

## java formatter
./go //ide/plugins/java-format:java-format
### artifact: build/ide/plugins/java-format/java-format.xpi

## python formatter
./go //ide/plugins/python-format:python-format
### artifact: build/ide/plugins/python-format/python-format.xpi

## ruby formatter
./go //ide/plugins/ruby-format:ruby-format
### artifact: build/ide/plugins/ruby-format/ruby-format.xpi

## editor
./go //ide/main:selenium-ide
# artifact: build/ide/main/selenium-ide.xpi

