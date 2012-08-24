/**
 *
 * Simple (and hacky) script which tests library functions for potential XSS input vectors.
 *
 * The framework itself has no dependencies. Only tested with Chrome 21.
 *
 * For functions that do not pass the test aka "unsafe" (alert function is executed), developers is advised
 * to encode untrusted input before it is used as an argument to the jQuery function to avoid XSS vulnerabilities.
 *
 * Tested in Chrome (know for sure it does not run in IE)
 *
 * License: Creative Commons Attribution-ShareAlike 3.0 Unported License
 * Author: Ståle Pettersen, July 2012 (staale * gmail com)
 */


// Name of library you are testing (only used to have a n:
window.libraryName = 'jQuery 1.8.0';
// Library you want to test is bound to this variable:
window.libraryFunction = $;


// Each tests result has this structure: { number : int, functionName: string, safe: boolean }
window.results = {};

// Overload alert to detect when the XSS injection string is being executed.
window.alert = function (testNumber) {

    window.results[testNumber].safe = false;

    //console.log('Mocked alert: ' + testNumber);
    return;
}

window.addEventListener('DOMContentLoaded', function() {

    var testContainer = document.getElementById('testarea');

    function executeFunctions() {
        var testNumber = 0;

        // Extended functions
        for(var entry in window.libraryFunction) {
            testFunctionWithName(entry, testNumber);
            testNumber++;
        }

        // Regular functions
        for(var entry in window.libraryFunction.fn) {
            testFunctionWithName(entry, testNumber);
            testNumber++;
        }

        function testFunctionWithName(functionName, testNumber) {
            window.results[testNumber] = { "safe": true, "functionName": functionName };
            injectXssStrings(functionName, testNumber);
        }
    }

    function showResultInBrowser() {
        var resultElement = document.getElementById('result')
        if(resultElement) {
            var htmlResult = window.libraryName + ': ' + 'Found ' +
                totalNumberOfUnsafeFunctions() + ' unsafe functions out of ' + totalNumberOfFunctions() + '.';

            htmlResult += '<ul>';

            var unsafeFunctions = getUnsafeFunctions();
            for (var i = 0; i < unsafeFunctions.length; i++) {
                htmlResult += '<li>' + unsafeFunctions[i].functionName + '</li>';
            }

            htmlResult += '</ul>';

            // Using unsafe function without encoding the data... im crazy!
           resultElement.innerHTML = htmlResult;
        }
    }

    function injectXssStrings(entry, i) {
        // Skip jQuery.noConflict since it deregister the jQuery object
        if (entry.indexOf('noConflict') !== -1) {
            return;
        }
        // Injection strings for different contexts (css is skipped)
        var tagInjection = '<script>alert(' + i + ')</script>';
        var urlInjection = 'javascript:alert(' + i + ');';
        var jsInjection = 'alert(' + i + ')';
        var attributeInjection = '\'" img=/ onload=alert(' + i + ');//';

        var injections = [
            tagInjection,
            urlInjection,
            jsInjection,
            attributeInjection
        ];

        // Inject strings in function
        for (var i = 0; i < injections.length; i++) {
            var injection = injections[i];

            try {
                window.libraryFunction(testContainer)[entry](injection);
            } catch (e) {
            }
            try {
                try {
                    window.libraryFunction[entry](injection);
                } catch (e) {
                }
            } catch (e) {
            }

          /*  try {
                jQuery(testContainer)[entry](injection, injection);
            } catch (e) {
            }


            try {
                jQuery(testContainer)[entry]('dummy', injection);
            } catch (e) {
            }

            try {
                jQuery(testContainer)[entry](injection, 'dummy');
            } catch (e) {
            }

            try {
                jQuery(testContainer)[entry]('dummy', 'dummy', injection);
            } catch (e) {
            }

            try {
                jQuery(testContainer)[entry](injection, 'dummy', 'dummy');
            } catch (e) {
            }*/


        }
    }

    // Start the testsuite:
    ( function () {
        executeFunctions();
        showResultInBrowser();
    })();
});

/*
 *  Functions that can be used to access test results from other windows
 */

function totalNumberOfFunctions() {
    if(!window.results) return 0;
    return Object.keys(window.results).length;
}

function totalNumberOfUnsafeFunctions() {
    return getUnsafeFunctions().length;
}

function getUnsafeFunctions() {
    if(!window.results) return 0;
    var unsafeFunctions = [];
    for(var result in window.results) {
        if(window.results[result].safe === false) {
            unsafeFunctions.push(window.results[result]);
        }
    }
    return unsafeFunctions;
}

function totalNumberOfSafeFunctions() {
    return totalNumberOfFunctions() - totalNumberOfUnsafeFunctions();
}

