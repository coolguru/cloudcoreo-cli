#!/bin/bash

get_options_output () {
    local command=$1
    gather=false
    $command | while read line; do
	if [ -z "$line" ]; then
	    continue
	fi
	if echo "$line" | grep -q "\s*Examples:\s*$"; then
	    gather=false;
	fi
	
	if [ $gather = "true" ]; then
	    if ! echo $line | grep -q "^help"; then
		
		echo $line
	    fi
	fi
	
	if echo "$line" | grep -q "\s*Options:\s*$"; then
	    if [ $gather = "false" ]; then
		gather=true
	    fi
	fi
	
    done
    
}

get_examples_output () {
    local command=$1
    gather=false
    $command | while read line; do
	if [ $gather = "true" ]; then
	    if ! echo $line | grep -q "^help"; then
		
		echo $line
	    fi
	fi
	
	if echo "$line" | grep -q "\s*Examples:\s*$"; then
	    if [ $gather = "false" ]; then
		gather=true
	    fi
	fi
	
    done
    
}

get_command_output () {
    local command=$1
    gather=false
    $command | while read line; do
	if [ -z "$line" ]; then
	    continue
	fi
	if echo "$line" | grep -q "\s*Options:\s*$"; then
	    gather=false;
	fi
	
	if [ $gather = "true" ]; then
	    if ! echo $line | grep -q "^help"; then
		
		echo $line
	    fi
	fi
	
	if echo "$line" | grep -q "\s*Commands:\s*$"; then
	    if [ $gather = "false" ]; then
		gather=true
	    fi
	fi
	
    done
    
}

title(){
    local output="$1"
    echo "# $output"
    echo "======================================================================"
}

level1title(){
    local output="$1"
    echo "## $output"
    echo
}

level2title(){
    local output="$1"
    echo "### $output"
    echo
}

level4title(){
    local output="$1"
    echo "##### $output"
    echo
}

level5title(){
    local output="$1"
    echo "###### $output"
    echo
}

level3title(){
    local output="$1"
    echo "#### $output"
    echo
}

writeCode(){
    local output="$1"
    echo '```'
    echo "$output"
    echo '```'
}
getDoc(){
    local doc="$1"
    output="$(cat partials/$1)"
    echo "$output"
}
title "CloudCoreo CLI"
echo
getDoc "INSTALL.md"
#echo
#getDoc "CONFIGURE.md"
echo
level1=$(get_command_output "./coreo.js --help")
level1title "Commands"
echo "The following is a list of commands that can be run with the CLI tool. This is auto-generated."
echo
opts="$(get_options_output "./coreo.js --help")"
level4title "Options"
writeCode "$opts"
echo
echo "The [CloudCoreo](http://www.cloudcoreo.com/) CLI uses git-style subcommands."
echo "For help, try:"
writeCode "coreo help <command>"
echo "or"
writeCode "coreo <command> help <subcommand>"
echo "$level1" | while read line; do
    command=$(echo "$line" | awk '{print $1}')
    desc=$(echo "$line" | awk '{first = $1; $1 = ""; print $0; }' | perl -pe 's{^\s(.*$)}{\1}g')
    echo
    level2title "coreo $command"
    echo "$desc"
    level3title "Options"
    opts="$(get_options_output "./coreo.js help $command")"
    writeCode "$opts"
    level2=$(get_command_output "./coreo.js help $command")
    level3title "Actions"
    echo "$level2" | while read lineLev3; do
	commandLev3=$(echo "$lineLev3" | awk '{print $1}')
	descLev3=$(echo "$lineLev3" | awk '{$1=$2=""; print $0}')
	level4title "Action: $commandLev3"
	echo "$descLev3"
	echo
	opts="$(get_options_output "./coreo.js $command $commandLev3 --help")"
	level5title "Options:"
	writeCode "$opts"
	exam="$(get_examples_output "./coreo.js $command $commandLev3 --help")"
	level5title "Examples:"
	writeCode "$exam"
    done
done

