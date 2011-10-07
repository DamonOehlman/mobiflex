CWD=`pwd`

build:
	@node build.js
	@lessc src/css/mobiflex.less dist/css/mobiflex.css
	@cp src/css/animations.css dist/css/animations.css
	@cp -r src/css/themes dist/css
	@cp -r src/img dist/css
	
test:
	# node test/db.js

.PHONY: test