.PHONY: lint lint-fix format test typecheck clean install preuninstall

install:
	bun install

lint:
	bun run lint

lint-fix:
	bun run lint:fix

format:
	bun run format

test:
	bun test

typecheck:
	bun run typecheck

postinstall:
	node postinstall.mjs

preuninstall:
	node preuninstall.mjs

clean:
	rm -rf node_modules bun.lock
