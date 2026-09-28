.PHONY: install test build link clean

install:
	npm install

test:
	npm test

build:
	npm run build

# Put git-chronicle on your PATH, pointing at this checkout
link: build
	npm link

clean:
	rm -rf dist
