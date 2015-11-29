"use strict";

// Globals
var mobileUserAgentREs = [/Android/i, /BlackBerry/i, /iPad/i, /iPhone/i,
        /iPod/i, /webOS/i, /Windows, Phone/i];

// Public methods

function clearMoveQueue() {
    moveQueue.length = 0;
    rotationQueue.length = 0;
}

// Copy a map. Note that this is not a deep/recursive copy.
function copyMap(oldMap) {
    var newMap = {};
    for ( var item in oldMap) {
        newMap[item] = oldMap[item];
    }
    return newMap;
}

// Convert an elapsed amount of time to mm:ss.x format.
function elapsedMsecToStr(elapsedMsec) {
    if (elapsedMsec === null) {
        return "";
    }
    // Work with integers and then add the decimal later.
    var deciSecs = 0 | ((elapsedMsec + 0.5) / 100);
    var minutes = 0 | ((deciSecs + 0.5) / 600);
    if (minutes) {
        deciSecs = 0 | (deciSecs % 600 + 0.5);
        var dsStr = "" + deciSecs;
        while (dsStr.length < 3) {
            dsStr = "0" + dsStr;
        }
        var elapsedStr = "" + minutes + ":" + dsStr;
    } else {
        var elapsedStr = "" + deciSecs;
    }

    // Add the decimal point.
    elapsedStr = elapsedStr.substr(0, elapsedStr.length - 1) + "."
            + elapsedStr.substr(elapsedStr.length - 1, 1);

    return elapsedStr;
}

// Queues up a move along with it's corresponding rotation. Note that index to
// index moveQueue and rotationQueue must be kept in sync.
function enqueueMove(move) {
    moveQueue.push(move);
    rotationQueue.push(getRotationFromMove(move));
}

// Queues up a move along with it's corresponding rotation. Note that index to
// index moveQueue and rotationQueue must be kept in sync.
function enqueueMoves(moves) {
    for ( var i in moves) {
        enqueueMove(moves[i]);
    }
}

// For a given move return the inverse move that will undo it.
function getInverseMove(move) {
    if (move.indexOf("2") !== -1) {
        // Doubles are their own inverse.
        return move;
    }

    if (move.indexOf("'") !== -1) {
        // It was prime, return non-prime.
        return move.replace("'", "");
    } else {
        // It as non-prime, return prime.
        return move + "'";
    }
}

// Converts a rotation to a move.
function getMoveFromRotation(rotation) {
    return rotationToMove[rotation];
}

// Converts a move to rotation. Returns undefined for savepoints.
function getRotationFromMove(move) {
    return moveToRotation[move.replace("G", "")];
}

// Return the name of the coordinate that has the largest absolute value.
function largestAbsoluteAxis(vector) {
    var axes = ["x", "y", "z"];
    var axisMax = -1;
    var axisName;
    for (var i = 0; i <= axes.length; i++) {
        var axis = axes[i];
        var axisAbs = Math.abs(vector[axis]);
        if (axisAbs > axisMax) {
            axisMax = axisAbs;
            axisName = axis;
        }
    }
    return axisName;
}

// Convert a map to a space separated key:value list.
function mapToString(map) {
    var first = true;
    var str = "";
    for ( var item in map) {
        str += (first ? "" : " ") + item + ":" + map[item];
        first = false;
    }
    return str;
}

// Normalize the color.
function normalizeColor(color) {
    if (color.constructor === Number) {
        return color;
    } else {
        return color.toLowerCase().indexOf("0x") === -1 ? color
                : parseInt(color)
    }
}

// Return true if the device is mobile. Inspired by:
// http://stackoverflow.com/questions/11381673/detecting-a-mobile-browser
function isMobile() {
    for (var i = 0; i < mobileUserAgentREs.length; i++) {
        var re = mobileUserAgentREs[i];
        if (navigator.userAgent.match(re)) {
            return true;
        }
    }
    return false;
}

// Set a global variable by name while preserving the type of the global.
function setGlobal(varName, varValueStr) {
    console.log("setting global " + varName + " to " + varValueStr);
    var varValue;
    var varType = window[varName].constructor;
    if (!varType) {
        console.log("Ignoring unknown variable \"" + varName + "\".");
        return;
    }
    if (varType === Array) {
        if (varValueStr !== "") {
            varValue = varValueStr.split(" ");
            if ((window[varName].length > 0)
                    && (window[varName][0].constructor === Number)) {
                // If the array contained integers then convert to that.
                var varValueNum = [];
                for (var i = 0; i < varValue.length; i++) {
                    varValueNum.push(parseInt(varValue[i]));
                }
                varValue = varValueNum;
            }
        } else {
            // If it's empty we don't need to know the type of the elements.
            varValue = [];
        }
    } else if (varType === Boolean) {
        varValue = varValueStr.toLowerCase().substr(0, 1) === "t";
    } else if (varType === Number) {
        if (varValueStr.indexOf(".") !== -1) {
            varValue = parseFloat(varValueStr);
        } else {
            varValue = parseInt(varValueStr);
        }
    } else if (varType === Object) {
        varValue = varValueStr.split(" ");
        var varValueMap = {};
        for (var i = 0; i < varValue.length; i++) {
            var entry = varValue[i];
            if (!entry) {
                continue;
            }
            var keyValue = entry.split(":");
            var key = keyValue[0];
            var value = keyValue[1];
            if (!key || !value) {
                continue;
            }
            varValueMap[key] = value;
        }
        varValue = varValueMap;
    } else {
        varValue = varValueStr;
    }
    window[varName] = varValue;
}

// Wrap the next so that no line exceeds cols columns.
function wrapWithComments(text, cols) {
    if (!cols) {
        // Use a large value so it does not wrap.
        cols = 10000;
    }
    var result = "";
    for (var idx = 0; idx < text.length; idx = end + 1) {
        if ((idx + cols - 2) < text.length) {
            var sp = text.substring(idx, idx + cols - 2).lastIndexOf(" ");
            if (sp === -1) {
                console.log("Could not find a space in \"" + text + "\".");
                return result;
            }
            var end = idx + sp;
        } else {
            var end = text.length;
        }
        var line = "# " + text.substring(idx, end);
        result += (result ? "\n" : "") + line;
    }
    return result;
}
