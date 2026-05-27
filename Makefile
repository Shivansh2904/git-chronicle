.PHONY: install dev test build link publish clean

install:
	npm install

dev:
	npm run dev

test:
	npm test

build:
	npm run build

# Link as global command for local testing
link: build
	npm link

publish: build test
	npm publish --access public

clean:
	rm -rf dist node_modules .vitest-cache

help:
	@echo "Common targets:"
	@echo "  make install   Install dependencies"
	@echo "  make dev       Run from TypeScript source via tsx"
	@echo "  make test      Run Vitest suite"
	@echo "  make build     Compile to dist/"
	@echo "  make link      Link as global git-chronicle command"
	@echo "  make publish   Build, test, and publish to npm"
