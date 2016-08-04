// Naive Brainfuck Interpreter
// by Xioustic
// Based on http://www.hevanet.com/cristofd/brainfuck/brainfuck.html

(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define([], factory);
    } else if (typeof exports === 'object') {
        // Node, CommonJS-like
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.brainfuck = factory();
    }
}(this, function() {
    // "an array, or ordered set, of at least 30,000 cells"
    var MEMSIZE = 65536;
    var buffer = new ArrayBuffer(MEMSIZE);

    // "Each cell holds an integer value (minimally and usually one byte)"
    // "If that cell was already at its maximum value, it may (or may not) assume its minimum value."
    // "If that cell was already at its minimum value, it may (or may not) assume its maximum value."
    var data = new Uint8Array(buffer);

    // "has an initial value of zero""
    // NOTE: this is superfluous in javascript; array buffers are always initialized to 0
    for (var i = 0; i < data.length; i++) {
        data[i] = 0;
    }

    // "A brainfuck program uses a movable pointer to manipulate an array""
    var dataPtr = 0;

    // points to next instruction to be executed
    var instructionPtr = 0;

    var instructions = '';
    var jumps = [];

    var output = '';

    // if seek mode is greater than 0, we're seeking forward until next matching ]
    var seekMode = 0;

    var debug = true;

    var setDebug = function(setval) { debug = setval }

    var processInstruction = function(instruction) {
        // "The > command moves the pointer to the next cell to the right."
        if (instruction === '>' && !seekMode) {
            dataPtr++;
            if (dataPtr >= MEMSIZE) throw "Error: Exceeded MEMSIZE"
        }
        // "The < command moves the pointer to the next cell to the left."
        else if (instruction === '<' && !seekMode) {
            dataPtr--;
            if (dataPtr < 0) throw "Error: dataPtr is negative"
        }
        // "The + command increments (increases by one) the value of the cell indicated by the pointer."
        else if (instruction === '+' && !seekMode) {
            data[dataPtr]++;
        }
        // "The - command decrements (decreases by one) the value of the cell indicated by the pointer."
        else if (instruction === '-' && !seekMode) {
            data[dataPtr]--;
        }
        // "The [ command checks the value of the cell indicated by the pointer, and if its value is zero, 
        // control passes not to the next command, but to the command following the matching ']' command."
        else if (instruction === '[') {
            // if we're seeking, increment
            if (seekMode) seekMode++;
            // if we're not seeking and data is 0, start seeking
            else if (data[dataPtr] === 0) seekMode++;
            // if we're not seeking and data is not 0, push this instruction jump point
            else jumps.push(instructionPtr);
        }
        // "The ] command checks the value of the cell indicated by the pointer, and if its value is nonzero, 
        // control passes not to the next command, but to the command following the matching '[' command."
        else if (instruction === ']') {
            // if we're seeking, decrement
            if (seekMode) seekMode--;
            // if we're not seeking and data is not 0, set instruction pointer to last jump
            else if (data[dataPtr] !== 0) instructionPtr = jumps.pop() - 1;
            // otherwise just kill the related jump point
            else jumps.pop()
        }
        // "The . command outputs the value of the cell indicated by the pointer."
        else if (instruction === '.' && !seekMode) {
            var ascii = String.fromCharCode(data[dataPtr]);
            output += ascii;
            if (debug) console.log(ascii);
        }
        // "The , command requests one byte of input, and sets the cell indicated by the pointer to the value 
        // received, if any.""
        else if (instruction === ',' && !seekMode) {
            throw "Error: Getting input not implemented"
                //data[dataPtr] = getInput();
        }
        // no valid instructions matched, move to next instruction
        else {
            instructionPtr++;
            return;
        }

        // we performed an instruction, check if it's new before adding to instruction list
        // if (instructionPtr === instructions.length) {
        //     instructions += instruction;
        // }

        // increment instruction pointer
        if (debug) console.log('did', instruction, 'iptr', instructionPtr, 'd', data[dataPtr], 'dptr', dataPtr, 's', seekMode, 'j', jumps);
        instructionPtr++;

        return;
    }

    // does the next instruction; if no instruction, return -1
    var doNextInstruction = function() {
        var nextInstruction = instructions[instructionPtr];
        if (nextInstruction === undefined) return -1;
        else processInstruction(nextInstruction);
    }

    // adds instructions to the brainfuck instance
    var addInstructions = function(newInstructions) {
        instructions += newInstructions;
    }

    // does the next instruction until the end, then returns -1
    var run = function() {
        while (true) {
            var retval = doNextInstruction();
            if (retval === -1) break;
        }
        console.log(output);
        output = '';
        return -1;
    }

    var emitState = function(callable) {
        callable({ dataPtr, instructions, instructionPtr, jumps, seekMode, output })
    }

    var reset = function() {
        for (var i = 0; i < data.length; i++) {
            data[i] = 0;
        }
        dataPtr = 0;
        instructions = '';
        instructionPtr = 0;
        jumps = [];
        seekMode = 0;
        output = '';
    }

    return {
        doNextInstruction: doNextInstruction,
        processInstruction: processInstruction,
        emitState: emitState,
        addInstructions: addInstructions,
        run: run,
        reset: reset,
        setDebug: setDebug
    };
}));
