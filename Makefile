PREFIX ?= /usr/local

.PHONY: all test lint clean install

all:
	zig build -Doptimize=ReleaseSafe

test:
	zig build test

lint:
	zig fmt src/
	zig fmt --check src/

clean:
	rm -rf zig-out .zig-cache

install: all
	install -d $(PREFIX)/bin
	install -m 755 zig-out/bin/opencoder $(PREFIX)/bin/
