// Note: This script is not in use, just keeping it around as reference.
// Requires xml2json, jQuery
// Script that parse the documentation for jQuery and inserts an injection string in all function that has a arguments.
// If the unencoded string argment executes as Javascript, we mark the function as unsafe to use without encoding and/or validation.

window.results = [];

// Overload alert to detect when the XSS injection string is being executed.
window.alert = function (testNumber) {

    window.results[testNumber] = true;

    console.log('Mocked alert: ' + testNumber);
    return;

}

$(document).ready(function () {
    console.log('started');

    var testareaWrapper = jQuery('#testareaWrapper');
    var testContainer = jQuery('#testarea');
    var resultTable = jQuery('#jqueryTable tbody');

    function parseXmlAndRunTests(xml) {

        var apiData = x2js.xml2json(xml);

        executeFunctions(apiData);

        updateTableWithVulnerabilities();
    }

    function executeFunctions(apiData) {
        $.each(apiData.api.entries.entry_asArray, function (i, entry) {

            window.results[i] = false;

            resultTable.append($('<tr><td>' + entry._name + '</td><td class="testresult" id="result' + i + '">Safe</td></tr>'));

            $.each(entry.signature, function (signatureIndex, signature) {
                injectXssStrings(entry, i);
            });
        })
    }

    function updateTableWithVulnerabilities() {
        // Update table with our testresults:
        var totalVulns = 0;
        var i;
        for (i = 0; i < window.results.length; ++i) {
            if (window.results[i] === true) {
                var target = $('#result' + i);
                target.addClass('failed');
                target.html('Unsafe: Argument(s) to function need to be encoded and/or validated');
                totalVulns++;
            }
        }
        $("#jqueryTable").tablesorter({
            sortList : [[1, 1]] // Sort so unsafe functions to the top
        });
        $('#result').text('Total number of unsafe functions: ' + totalVulns + ' (of total ' + window.results.length + ')');
    }

    function hasArgumentType(signature, type) {
        return (
            signature.argument !== undefined
                && typeof signature.argument._type === 'string'
                && signature.argument._type.indexOf(type) !== -1)
            ||
            (signature._type !== undefined
                && typeof signature._type === 'string'
                && signature._type.indexOf(type) != -1);
    }

    function injectXssStrings(entry, i) {
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
                jQuery(testContainer)[entry._name](injection);
            } catch (e) {
            }

/*
            try {
                jQuery(testContainer)[entry._name]('dummy', injection);
            } catch (e) {
            }

            try {
                jQuery(testContainer)[entry._name](injection, 'dummy');
            } catch (e) {
            }

            try {
                jQuery(testContainer)[entry._name]('dummy', 'dummy', injection);
            } catch (e) {
            }

            try {
                jQuery(testContainer)[entry._name](injection, 'dummy', 'dummy');
            } catch (e) {
            }
*/
            try {
                try {
                    jQuery[entry._name](injection);
                } catch (e) {
                }
            } catch (e) {
            }

            try {
                // Low level API
                // Skip jQuery.noConflict since it deregister the jQuery object
                if (
                    typeof entry._name === 'string'
                        && entry._name.indexOf('jQuery') !== -1
                        && entry._name !== 'jQuery.noConflict') {

                    jQuery[entry._name.replace('jQuery.', '')](jsInjection);
                }
            } catch (e) {
            }
        }
    }

    // Start by fetching jquery API in XML-format
    $.ajax({
        type:'GET',
        url:'http://api.jquery.com/api/',
        dataType:'xml',
        success: function(data) {
            parseXmlAndRunTests(data)
        },
        error: function (e) {
            alert('Could not load jQuery-XML :( ' + e);
        }
    });
});


// Dont die in old school browsers
if ("undefined" === typeof window.console) {window.console = {"log":function () {}};};
