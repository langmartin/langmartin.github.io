target = ..
sources = $(basename $(wildcard *.org))

all: $(addprefix $(target)/,$(addsuffix .html,$(sources)))

$(target)/%.html: %.org Makefile
	pandoc -s -t html5 \
	--css static/style.css \
	-o $@ $<

$(target)/static: static/*
	mkdir $@
	cp $^ $@
