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
	if [ -z "$line" ]; then
	    continue
	fi
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

level3title(){
    local output="$1"
    echo "#### $output"
    echo
}

commandOutput(){
    local output="$1"
    echo '```'
    echo "$output"
    echo '```'
}

level1=$(get_command_output "./coreo.js --help")

level1title "Command: **coreo**"
opts="$(get_options_output "./coreo.js --help")"
level2title "Options"
echo "$opts" | while read opt; do 
    desc="$(echo $opt | awk '{$1=$2=""; print $0}')"
    arg="$(echo $opt | awk '{print $1 $2}')"
    level3title "$arg"
    echo "$desc"
    echo
done

echo "$level1" | while read line; do
    command=$(echo $line | awk '{print $1}')
    desc=$(echo $line | awk '{first = $1; $1 = ""; print $0, first; }')
    get_options_output "./coreo.js help $command"
    level2=$(get_command_output "./coreo.js help $command")
    echo "$level2" | while read lineLev3; do
	commandLev3=$(echo $lineLev3 | awk '{print $1}')
	descLev3=$(echo $lineLev3 | awk '{$1=$2=""; print $0}')
	get_options_output "./coreo.js $command $commandLev3 --help"
	get_examples_output "./coreo.js $command $commandLev3 --help"
    done
done

