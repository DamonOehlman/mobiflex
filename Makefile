CWD=`pwd`

build:
	@rm -r dist
	@mkdir dist && mkdir dist/css
	@interleave src -p dist --wrap oldschool
	@node_modules/less/bin/lessc src/css/mobiflex.less dist/css/mobiflex.css
	@cp src/css/animations.css dist/css/animations.css
	@cp -r src/css/themes dist/css
	@cp -r src/img dist/css
	
test:
	# node test/db.js

.PHONY: test