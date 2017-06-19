var enableTool = true,
    documentZoom = 100,
    borderThickness = 1,
    labelSpacing = 5,
    hoveredElement = '',
    selectedElement = '',
    elemMeas = { width: 0, height: 0, offsetTop: 0, offsetLeft: 0 },
    elemSelectMeas = { width: 0, height: 0, offsetTop: 0, offsetLeft: 0 },
    intraElemMeas = { top: 0, right: 0, bottom: 0, left: 0, trueTop: 0, trueRight: 0, trueBottom: 0, trueLeft: 0 },
    redlineClass,
    dimensionMarkerWidth = 0,
    dimensionMarkerHeight = 0,
    documentClone;

var cssProperties = { 'properties': { 'width': '', 'height': '' }, 'styles': { 'background-color': '', 'opacity': '', 'border-top': '', 'border-right': '', 'border-bottom': '', 'border-left': '', 'border-top-style': '', 'border-right-style': '', 'border-bottom-style': '', 'border-left-style': '', 'border-top-width': '', 'border-right-width': '', 'border-bottom-width': '', 'border-left-width': '', 'border-top-color': '', 'border-right-color': '', 'border-bottom-color': '', 'border-left-color': '', 'border-style': '', 'border-width': '', 'border-color': '', 'border-top-left-radius': '', 'border': '', 'border-top-right-radius': '', 'border-bottom-right-radius': '', 'border-bottom-left-radius': '', 'border-radius': '', 'box-shadow': '' }, 'text': { 'font-family': '', 'font-size': '', 'font-weight': '', 'line-height': '', 'text-align': '', 'color': '', '_content': '' } };

$(window).on('load', function() {
    //*****I'm not insane for doubley defining this function. This needs to be done otherwise the demo won't work.*****
    onLoadFunction();
});

//*************************************************************************************************
//*                   Wrap onLoad events in function to call during demo.                         *
//*************************************************************************************************
function onLoadFunction() {
    checkState();
    initTool();
    documentClone = $('body').clone(true);
    enableRedline();
}

//*************************************************************************************************
//*                                 Initialize our tool.                                          *
//*************************************************************************************************
function checkState() {
    var trackingCookie = getCookie('axure-tool-enabled');

    if (trackingCookie != '' && trackingCookie == 1) {
        enableTool = true;
    } else if (trackingCookie != '' && trackingCookie == 0) {
        enableTool = false;
    } else {
        setCookie('axure-tool-enabled', '1', 1);
    }
}

//*************************************************************************************************
//*                                 Initialize our tool.                                          *
//*************************************************************************************************
function initTool() {
    var width = 0,
        height = 0,
        top = 0,
        left = 0,
        maxWidth = 0,
        maxHeight = 0,
        padding = 1000;

    $('.redline-tool-wrapper *').addClass('redline-layer'); //Label all redline tool elelemnts.
    $('.redline-layer').hide();
    $('.redline-tool-wrapper').show();
    $('#top-control-panel').show();
    $('#top-control-panel *').show();
    $('#redline-panel').show();
    $('#redline-panel *').show();

    $('#base').wrap('<div class="zoom-wrapper"></div>');
    $('#base').addClass('redline-layer');
    $('.zoom-wrapper').addClass('redline-layer');
    $('#base *').each(function(i) {
        width = $(this).outerWidth();
        height = $(this).outerHeight();
        top = $(this).offset().top;
        left = $(this).offset().left;

        $(this).data('thedimensions', { width: width, height: height, offsetTop: top, offsetLeft: left });
        maxWidth = maxWidth < left + width ? left + width : maxWidth;
        maxHeight = maxHeight < top + height ? top + height : maxHeight;
    });
    //*****Manually size our containers sue to absolutely-positioned children.*****
    $('.zoom-wrapper').attr('style', 'width:' + (maxWidth + (2 * padding)) + 'px !important;' + 'height:' + (maxHeight + (2 * padding)) + 'px !important;');
    console.log(padding);
    $('#base').attr('style', 'width:' + maxWidth + 'px !important;' + 'height:' + maxHeight + 'px !important;' + 'top:' + padding + 'px !important; left:' + padding + 'px !important;');
    //*****If content has no background color, define as #FFFFFF.*****
    if ($('#base').css('background-color').match(/rgba\(\d+,\s\d+,\s\d+,\s0\)/).length > 0) {
        $('#base').css('background-color', '#FFFFFF');
    }
    $(document).scrollTop(896);
    //console.log($('#base').scrollTop());
}

//*************************************************************************************************
//*                               Bind our event listeners.                                       *
//*************************************************************************************************
function bindListeners() {
    //*****Enable/Disable Redline Tool*****
    $('#redline-panel').on('change', '.switch', function() {
        enableTool = $('.toggle-switch').prop('checked');
        enableRedline();
    });

    //*****Element Hover*****
    $('body').on('mouseenter', '*', function(e) {
        e.stopImmediatePropagation();
        elementHover($(this));
    });

    //*****Element Leave*****
    $('body').on('mouseleave', '*', function() {
        clearRedline();
    });

    //*****Element Click/Clickaway*****
    $('body').on('click', '*', function(e) {
        e.stopImmediatePropagation();
        if ($(this).hasClass('zoom-wrapper') || $(this).attr('id') == 'base') {
            closeRedline();
        } else {
            elementClick($(this));
        }
    });

    //*****Open/Close Redline Panel*****
    $('#redline-panel').on('click', '#menu-tab-column > div', function(e) {
        e.stopImmediatePropagation();
        $('#redline-panel').toggleClass('redline-panel-exposed');
    });

    //*****Autoselect Redline Panel Content****
    $('#redline-panel').on('mouseup', 'input, textarea', function() {
        $(this).select();
    });

    //*****Handle Zoom Controls*****
    $('#top-control-panel').on('click', '.zoom-control-button', function() {
        clearRedline();
        getZoom();
        if ($(this).children().text() == '+') {
            documentZoom += 10;
        } else {
            documentZoom -= 10;
        }

        setZoom();

        if (selectedElement) {
            highlightSelectElement();
        }
    });

    //*****Allow Zoom Input Value*****
    $('#top-control-panel').on('focus', '#zoom-value', function(e) {
        $(this).select();
    });

    //*****Pass Zoom Value Input*****
    $('#top-control-panel').on('blur keypress', '#zoom-value', function(e) {
        if (e.keyCode == 13) {
            $(this).blur();
            getZoom();
            setZoom();
        } else if (e.keyCode === undefined) {
            getZoom();
            setZoom();
        }

    });
    $(document).scroll(function() {
        console.log($(this).scrollTop());
    });
}

//*************************************************************************************************
//*                             Enable or disable our tool.                                       *
//*************************************************************************************************
function enableRedline() {
    if (enableTool) {
        setCookie('axure-tool-enabled', '1', 1);
        $('.toggle-switch').prop('checked', true);
        $('*').off();
        bindListeners();
        $('.zoom-wrapper').show();
        $('.zoom-wrapper *').show();
        setZoom();
    } else {
        setCookie('axure-tool-enabled', '0', 1);
        setTimeout(function() {
            //closeRedline();
        }, 250);
        setTimeout(function() {
            $('html body').remove();
            $('html').append(documentClone.clone(true));
            $('.toggle-switch').prop('checked', false);
            bindListeners();
            //closeRedline();
            $('.zoom-wrapper').show();
            $('.zoom-wrapper *').show();
            setZoom();
        }, 250);
    }
}

//*************************************************************************************************
//*                             Handle element hover actions.                                     *
//*************************************************************************************************
function elementHover(element) {
    if (enableTool) {
        hoveredElement = element;
        if (!isRedlineElement(hoveredElement)) {
            highlightHoverElement();
            //*****Check if we're hovering over our previously-selected element.*****
            if (hoveredElement[0] == selectedElement[0]) {
                highlightSelectElement();
            } else if (selectedElement != '') {
                measureIntraElementDistance();
                drawIntraElementMarkers();
            }
        }
    }
}

//*************************************************************************************************
//*                             Handle element click actions.                                     *
//*************************************************************************************************
function elementClick(element) {
    if (enableTool) {
        if (!isRedlineElement(element)) {
            //selectedElement = findDeepestChild(element);
            selectedElement = element;
            clearRedline();
            highlightSelectElement();
            updateRedlinePanel(selectedElement);
        }
    }
}

//*************************************************************************************************
//*              Ensure we aren't interacting with a redline-specific element.                    *
//*************************************************************************************************
function isRedlineElement(element) {
    var redlineStatus;

    redlineStatus = element.attr('class') === undefined ? '' : element.attr('class');
    if (redlineStatus.indexOf('redline-layer') == '-1') {
        return false;
    } else {
        return true;
    }
}

//*************************************************************************************************
//*                  Highlight our hovered element and add extension lines.                       *
//*************************************************************************************************
function highlightHoverElement() {
    elemMeas.width = (hoveredElement.outerWidth() * (documentZoom / 100));
    elemMeas.height = (hoveredElement.outerHeight() * (documentZoom / 100));
    elemMeas.offsetTop = hoveredElement.offset().top;
    elemMeas.offsetLeft = hoveredElement.offset().left;
    $('.hover-layer').show();
    $('.hover-o-layer').show();
    $('#t-hover').width(elemMeas.width + borderThickness);
    $('#b-hover').width(elemMeas.width);
    $('#r-hover').height(elemMeas.height);
    $('#l-hover').height(elemMeas.height);

    $('#t-hover').offset({ top: elemMeas.offsetTop - borderThickness, left: elemMeas.offsetLeft - borderThickness });
    $('#b-hover').offset({ top: elemMeas.offsetTop + elemMeas.height, left: elemMeas.offsetLeft - borderThickness });
    $('#r-hover').offset({ top: elemMeas.offsetTop, left: elemMeas.offsetLeft + elemMeas.width });
    $('#l-hover').offset({ top: elemMeas.offsetTop, left: elemMeas.offsetLeft - borderThickness });

    $('#to-hover').width($(window).innerWidth() - (borderThickness * 2));
    $('#bo-hover').width($(window).innerWidth() - (borderThickness * 2));
    $('#ro-hover').height($(window).innerHeight() - (borderThickness * 2));
    $('#lo-hover').height($(window).innerHeight() - (borderThickness * 2));

    $('#to-hover').offset({ top: elemMeas.offsetTop - borderThickness, left: 0 });
    $('#bo-hover').offset({ top: elemMeas.offsetTop + elemMeas.height, left: 0 });
    $('#ro-hover').offset({ top: 0, left: elemMeas.offsetLeft + elemMeas.width });
    $('#lo-hover').offset({ top: 0, left: elemMeas.offsetLeft - borderThickness });
}

//*************************************************************************************************
//*                  Highlight our selected element and add extension lines.                      *
//*************************************************************************************************
function highlightSelectElement() {
    elemSelectMeas.width = (selectedElement.outerWidth() * (documentZoom / 100));
    elemSelectMeas.height = (selectedElement.outerHeight() * (documentZoom / 100));
    elemSelectMeas.offsetTop = selectedElement.offset().top;
    elemSelectMeas.offsetLeft = selectedElement.offset().left;
    $('.select-layer').show();
    $('#t-select').width(elemSelectMeas.width + borderThickness);
    $('#b-select').width(elemSelectMeas.width);
    $('#r-select').height(elemSelectMeas.height);
    $('#l-select').height(elemSelectMeas.height);

    $('#t-select').offset({ top: elemSelectMeas.offsetTop - borderThickness, left: elemSelectMeas.offsetLeft - borderThickness });
    $('#b-select').offset({ top: elemSelectMeas.offsetTop + elemSelectMeas.height, left: elemSelectMeas.offsetLeft - borderThickness });
    $('#r-select').offset({ top: elemSelectMeas.offsetTop, left: elemSelectMeas.offsetLeft + elemSelectMeas.width });
    $('#l-select').offset({ top: elemSelectMeas.offsetTop, left: elemSelectMeas.offsetLeft - borderThickness });

    $('#t-dimension').show();
    $('#r-dimension').show();
    $('#t-dimension > span').show();
    $('#r-dimension > span').show();
    dimensionMarkerWidth = $('.dimension-layer').width();
    dimensionMarkerHeight = $('.dimension-layer').height();
    $('#t-dimension > span').text(Math.round(selectedElement.data('thedimensions').width));
    $('#r-dimension > span').text(Math.round(selectedElement.data('thedimensions').height));

    $('#t-dimension').offset({ top: elemSelectMeas.offsetTop - dimensionMarkerHeight - labelSpacing, left: elemSelectMeas.offsetLeft + (elemSelectMeas.width / 2) - (dimensionMarkerWidth / 2) });
    $('#r-dimension').offset({ top: elemSelectMeas.offsetTop + (elemSelectMeas.height / 2) - (dimensionMarkerHeight / 2), left: elemSelectMeas.offsetLeft + elemSelectMeas.width + labelSpacing });
}

//*************************************************************************************************
//*             Measure distance between selected element to newly hovered element.               *
//*************************************************************************************************
function measureIntraElementDistance() {
    $.each(intraElemMeas, function(i, value) {
        intraElemMeas[i] = 0;
    });

    if (elemMeas.offsetTop > elemSelectMeas.offsetTop + elemSelectMeas.height) {
        intraElemMeas.bottom = Math.abs(elemSelectMeas.offsetTop + elemSelectMeas.height - elemMeas.offsetTop);
        intraElemMeas.trueBottom = Math.abs(selectedElement.data('thedimensions').offsetTop + selectedElement.data('thedimensions').height - hoveredElement.data('thedimensions').offsetTop);
    } else if (elemSelectMeas.offsetTop > elemMeas.offsetTop + elemMeas.height) {
        intraElemMeas.top = Math.abs(elemMeas.offsetTop + elemMeas.height - elemSelectMeas.offsetTop);
        intraElemMeas.trueTop = Math.abs(hoveredElement.data('thedimensions').offsetTop + hoveredElement.data('thedimensions').height - selectedElement.data('thedimensions').offsetTop);
    } else if (elemSelectMeas.offsetTop > elemMeas.offsetTop && elemSelectMeas.offsetTop + elemSelectMeas.height > elemMeas.offsetTop + elemMeas.height) {
        intraElemMeas.top = Math.abs(elemMeas.offsetTop - elemSelectMeas.offsetTop);
        intraElemMeas.trueTop = Math.abs(hoveredElement.data('thedimensions').offsetTop - selectedElement.data('thedimensions').offsetTop);
    } else if (elemSelectMeas.offsetTop < elemMeas.offsetTop && elemSelectMeas.offsetTop + elemSelectMeas.height < elemMeas.offsetTop + elemMeas.height) {
        intraElemMeas.bottom = Math.abs((elemMeas.offsetTop + elemMeas.height) - (elemSelectMeas.offsetTop + elemSelectMeas.height));
        intraElemMeas.trueBottom = Math.abs((hoveredElement.data('thedimensions').offsetTop + hoveredElement.data('thedimensions').height) - (selectedElement.data('thedimensions').offsetTop + selectedElement.data('thedimensions').height));
    } else {
        intraElemMeas.top = elemSelectMeas.offsetTop - elemMeas.offsetTop;
        intraElemMeas.bottom = (elemMeas.offsetTop + elemMeas.height) - (elemSelectMeas.offsetTop + elemSelectMeas.height);
        intraElemMeas.trueTop = selectedElement.data('thedimensions').offsetTop - hoveredElement.data('thedimensions').offsetTop;
        intraElemMeas.trueBottom = (hoveredElement.data('thedimensions').offsetTop + hoveredElement.data('thedimensions').height) - (selectedElement.data('thedimensions').offsetTop + selectedElement.data('thedimensions').height);
    }

    if (elemSelectMeas.offsetLeft > elemMeas.offsetLeft + elemMeas.width) {
        intraElemMeas.left = Math.abs(elemMeas.offsetLeft + elemMeas.width - elemSelectMeas.offsetLeft);
        intraElemMeas.trueLeft = Math.abs(elemMeas.offsetLeft + hoveredElement.data('thedimensions').width - selectedElement.data('thedimensions').offsetLeft);
    } else if (elemMeas.offsetLeft > elemSelectMeas.offsetLeft + elemSelectMeas.width) {
        intraElemMeas.right = Math.abs(elemSelectMeas.offsetLeft + elemSelectMeas.width - elemMeas.offsetLeft);
        intraElemMeas.trueRight = Math.abs(selectedElement.data('thedimensions').offsetLeft + selectedElement.data('thedimensions').width - hoveredElement.data('thedimensions').offsetLeft);
    } else if (elemSelectMeas.offsetLeft > elemMeas.offsetLeft && elemSelectMeas.offsetLeft + elemSelectMeas.width > elemMeas.offsetLeft + elemMeas.width) {
        intraElemMeas.left = Math.abs(elemMeas.offsetLeft - elemSelectMeas.offsetLeft);
        intraElemMeas.trueLeft = Math.abs(hoveredElement.data('thedimensions').offsetLeft - selectedElement.data('thedimensions').offsetLeft);
    } else if (elemSelectMeas.offsetLeft < elemMeas.offsetLeft && elemSelectMeas.offsetLeft + elemSelectMeas.width < elemMeas.offsetLeft + elemMeas.width) {
        intraElemMeas.right = Math.abs((elemMeas.offsetLeft + elemMeas.width) - (elemSelectMeas.offsetLeft + elemSelectMeas.width));
        intraElemMeas.trueRight = Math.abs((hoveredElement.data('thedimensions').offsetLeft + hoveredElement.data('thedimensions').width) - (selectedElement.data('thedimensions').offsetLeft + selectedElement.data('thedimensions').width));
    } else {
        intraElemMeas.left = elemSelectMeas.offsetLeft - elemMeas.offsetLeft;
        intraElemMeas.right = (elemMeas.offsetLeft + elemMeas.width) - (elemSelectMeas.offsetLeft + elemSelectMeas.width);
        intraElemMeas.trueLeft = selectedElement.data('thedimensions').offsetLeft - hoveredElement.data('thedimensions').offsetLeft;
        intraElemMeas.trueRight = (hoveredElement.data('thedimensions').offsetLeft + hoveredElement.data('thedimensions').width) - (selectedElement.data('thedimensions').offsetLeft + selectedElement.data('thedimensions').width);
    }
}

//*************************************************************************************************
//*                   Append our intra-element dimension lines and labels.                        *
//*************************************************************************************************
function drawIntraElementMarkers() {
    dimensionMarkerWidth = $('.dimension-layer').width();
    dimensionMarkerHeight = $('.dimension-layer').height();

    if (intraElemMeas.top != 0) {
        $('#t-measure').show();
        $('#t-measure').height(Math.abs(intraElemMeas.top) - borderThickness);
        if (intraElemMeas.top > 0) {
            $('#t-measure').offset({ top: elemSelectMeas.offsetTop - intraElemMeas.top, left: elemSelectMeas.offsetLeft + (elemSelectMeas.width / 2) });
        } else {
            $('#t-measure').offset({ top: elemSelectMeas.offsetTop, left: elemSelectMeas.offsetLeft + (elemSelectMeas.width / 2) });
        }
        $('#t-dimension').show();
        $('#t-dimension > span').show();
        $('#t-dimension > span').text(Math.round(Math.abs(intraElemMeas.trueTop)));
        $('#t-dimension').offset({ top: elemSelectMeas.offsetTop - (intraElemMeas.top / 2) - (dimensionMarkerHeight / 2), left: elemSelectMeas.offsetLeft + (elemSelectMeas.width / 2) + labelSpacing });
    }
    if (intraElemMeas.right != 0) {
        $('#r-measure').show();
        $('#r-measure').width(Math.abs(intraElemMeas.right) - borderThickness);
        if (intraElemMeas.right > 0) {
            $('#r-measure').offset({ top: elemSelectMeas.offsetTop + (elemSelectMeas.height / 2), left: elemSelectMeas.offsetLeft + elemSelectMeas.width });
        } else {
            $('#r-measure').offset({ top: elemSelectMeas.offsetTop + (elemSelectMeas.height / 2), left: elemSelectMeas.offsetLeft + elemSelectMeas.width + intraElemMeas.right });
        }

        $('#r-dimension').show();
        $('#r-dimension > span').show();
        $('#r-dimension > span').text(Math.round(Math.abs(intraElemMeas.trueRight)));
        $('#r-dimension').offset({ top: elemSelectMeas.offsetTop + (elemSelectMeas.height / 2) - dimensionMarkerHeight - labelSpacing, left: elemSelectMeas.offsetLeft + elemSelectMeas.width + (intraElemMeas.right / 2) - (dimensionMarkerWidth / 2) });
    }
    if (intraElemMeas.bottom != 0) {
        $('#b-measure').show();
        $('#b-measure').height(Math.abs(intraElemMeas.bottom) - borderThickness);
        if (intraElemMeas.bottom > 0) {
            $('#b-measure').offset({ top: elemSelectMeas.offsetTop + elemSelectMeas.height, left: elemSelectMeas.offsetLeft + (elemSelectMeas.width / 2) });
        } else {
            $('#b-measure').offset({ top: elemSelectMeas.offsetTop + elemSelectMeas.height + intraElemMeas.bottom, left: elemSelectMeas.offsetLeft + (elemSelectMeas.width / 2) });
        }

        $('#b-dimension').show();
        $('#b-dimension > span').show();
        $('#b-dimension > span').text(Math.round(Math.abs(intraElemMeas.trueBottom)));
        $('#b-dimension').offset({ top: elemSelectMeas.offsetTop + elemSelectMeas.height + (intraElemMeas.bottom / 2) - (dimensionMarkerHeight / 2), left: elemSelectMeas.offsetLeft + (elemSelectMeas.width / 2) + labelSpacing });
    }
    if (intraElemMeas.left != 0) {
        $('#l-measure').show();
        $('#l-measure').width(Math.abs(intraElemMeas.left) - borderThickness);
        if (intraElemMeas.left > 0) {
            $('#l-measure').offset({ top: elemSelectMeas.offsetTop + (elemSelectMeas.height / 2), left: elemSelectMeas.offsetLeft - intraElemMeas.left });
        } else {
            $('#l-measure').offset({ top: elemSelectMeas.offsetTop + (elemSelectMeas.height / 2), left: elemSelectMeas.offsetLeft });
        }

        $('#l-dimension').show();
        $('#l-dimension > span').show();
        $('#l-dimension > span').text(Math.round(Math.abs(intraElemMeas.trueLeft)));
        $('#l-dimension').offset({ top: elemSelectMeas.offsetTop + (elemSelectMeas.height / 2) - dimensionMarkerHeight - labelSpacing, left: elemSelectMeas.offsetLeft - (intraElemMeas.left / 2) - (dimensionMarkerWidth / 2) });
    }
}

//*************************************************************************************************
//*                                Update our redline spec panel.                                 *
//*************************************************************************************************
function updateRedlinePanel(element) {
    var propMatch;

    $.each(cssProperties, function(i, value) {
        $.each(cssProperties[i], function(_i, _value) {
            if (_i == '_content') {
                cssProperties[i][_i] = element.text().trim();
            } else {
                cssProperties[i][_i] = element.css(_i).replace(/rgba\(\d+,\s\d+,\s\d+,\s0\)/, 'transparent');
                //console.log(_i + ': ' + cssProperties[i][_i]);
            }
        });
    });

    //*****Concat granular values to shorthand and clear.*****    
    cssProperties['styles']['border-top'] = cssProperties['styles']['border-top-style'] + ' ' + cssProperties['styles']['border-top-width'] + ' ' + cssProperties['styles']['border-top-color'];
    cssProperties['styles']['border-right'] = cssProperties['styles']['border-right-style'] + ' ' + cssProperties['styles']['border-right-width'] + ' ' + cssProperties['styles']['border-right-color'];
    cssProperties['styles']['border-bottom'] = cssProperties['styles']['border-bottom-style'] + ' ' + cssProperties['styles']['border-bottom-width'] + ' ' + cssProperties['styles']['border-bottom-color'];
    cssProperties['styles']['border-left'] = cssProperties['styles']['border-left-style'] + ' ' + cssProperties['styles']['border-left-width'] + ' ' + cssProperties['styles']['border-left-color'];
    cssProperties['styles']['border-top-style'] = '';
    cssProperties['styles']['border-right-style'] = '';
    cssProperties['styles']['border-bottom-style'] = '';
    cssProperties['styles']['border-left-style'] = '';
    cssProperties['styles']['border-top-width'] = '';
    cssProperties['styles']['border-right-width'] = '';
    cssProperties['styles']['border-bottom-width'] = '';
    cssProperties['styles']['border-left-width'] = '';
    cssProperties['styles']['border-top-color'] = '';
    cssProperties['styles']['border-right-color'] = '';
    cssProperties['styles']['border-bottom-color'] = '';
    cssProperties['styles']['border-left-color'] = '';

    //*****Clear our border attribute tags because we'll populate them later.*****
    cssProperties['styles']['border-style'] = '';
    cssProperties['styles']['border-width'] = '';
    cssProperties['styles']['border-color'] = '';

    //*****Check if we have matching border attributes and consolidate.*****
    propMatch = cssProperties['styles']['border-top'];
    if (propMatch != '' && propMatch == cssProperties['styles']['border-right'] && propMatch == cssProperties['styles']['border-bottom'] && propMatch == cssProperties['styles']['border-left']) {
        cssProperties['styles']['border-top'] = '';
        cssProperties['styles']['border-right'] = '';
        cssProperties['styles']['border-bottom'] = '';
        cssProperties['styles']['border-left'] = '';

        cssProperties['styles']['border-style'] = selectedElement.css('border-top-style');
        if (cssProperties['styles']['border-style'] != 'none') {
            cssProperties['styles']['border-width'] = selectedElement.css('border-top-width');
            cssProperties['styles']['border-color'] = selectedElement.css('border-top-color');
            cssProperties['styles']['border'] = cssProperties['styles']['border-style'] + ' ' + cssProperties['styles']['border-width'] + ' ' + cssProperties['styles']['border-color'];
        }
    } else {
        cssProperties['styles']['border-style'] = '';
        cssProperties['styles']['border-width'] = '';
        cssProperties['styles']['border-color'] = '';
    }

    //*****Check if we have matching border-radius attributes and consolidate.*****
    propMatch = cssProperties['styles']['border-top-left-radius'];
    if (propMatch != '' && propMatch == cssProperties['styles']['border-top-right-radius'] && propMatch == cssProperties['styles']['border-bottom-right-radius'] && propMatch == cssProperties['styles']['border-bottom-left-radius']) {
        cssProperties['styles']['border-radius'] = cssProperties['styles']['border-top-right-radius'];

        cssProperties['styles']['border-top-left-radius'] = '';
        cssProperties['styles']['border-top-right-radius'] = '';
        cssProperties['styles']['border-bottom-right-radius'] = '';
        cssProperties['styles']['border-bottom-left-radius'] = '';
    }

    //*****Clean up our font family attributes.*****
    cssProperties['text']['font-family'] = cssProperties['text']['font-family'].replace('"', '').split(',')[0];

    console.log(cssProperties);
    clearRedlinePanel();
    appendRedlinePanel();
    $('#redline-panel').addClass('redline-panel-exposed');
}

//*************************************************************************************************
//*                                Append each property section.                                  *
//*************************************************************************************************
function appendRedlinePanel() {
    $.each(cssProperties, function(i, value) {
        $('#redline-panel-menu-column').append('<div class="redline-layer redline-panel-section"></div>');
        $('.redline-panel-section:last').append('<b class="redline-layer"><p class="redline-layer">' + i.toUpperCase() + '</p></b>');
        $.each(cssProperties[i], function(_i, _value) {
            if (_value !== undefined && _value.length > 0 && _value.indexOf('none') < 0 && _value != '0px') {
                $('.redline-panel-section:last').append('<p class="redline-layer">' + _i.replace('_', '') + ':</p>');
                if (_i != '_content') {
                    $('.redline-panel-section:last').append('<input class="redline-layer" value="' + _value + '" readonly="readonly"></input>');
                } else {
                    $('.redline-panel-section:last').append('<textarea class="redline-layer" readonly="readonly"></textarea>');
                    $('.redline-panel-section textarea').text(_value);
                }
            }
        });
        //*****Remove any sections without CSS properties.*****
        if ($('.redline-panel-section:last p').length <= 1) {
            $('.redline-panel-section:last').remove();
        }

    });
    //*****Remove a few items based on special queries.*****
    if (cssProperties['text']['_content'].length < 1) {
        $('p:contains("TEXT")').parent().parent().remove();
    }
    if (cssProperties['styles']['border-top-width'] == '0px') {
        $('p:contains("border-color")').next().remove();
        $('p:contains("border-color")').remove();
    }
}

//*************************************************************************************************
//*                       Strip all redline-specific elements from page.                          *
//*************************************************************************************************
function clearRedline() {
    $('.hover-layer').hide();
    $('.hover-o-layer').hide();
    $('.dimension-layer').hide();
    $('.measure-layer').hide();
}

//*************************************************************************************************
//*                              Handle 'click-aways' on page.                                    *
//*************************************************************************************************
function closeRedline() {
    clearRedline();
    $('.select-layer').hide();
    $('#redline-panel').removeClass('redline-panel-exposed');
    selectedElement = '';
    clearRedlinePanel();
}

//*************************************************************************************************
//*                           Clear all content in redline panel.                                 *
//*************************************************************************************************
function clearRedlinePanel() {
    $('#redline-panel-menu-column > *').not('div:first').remove();
}

//*************************************************************************************************
//*                             Find the deepest child element.                                   *
//*************************************************************************************************
function findDeepestChild(element) {
    var current = element;

    while (current.children().length > 1) {
        current = current.children();
    }

    return current;
}

//*************************************************************************************************
//*                      Set a tracking cookie for tool enabled/disabled.                         *
//*************************************************************************************************
function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}

//*************************************************************************************************
//*                                     Read cookies.                                             *
//*************************************************************************************************
function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return '';
}

//*************************************************************************************************
//*                                    Set zoom level.                                            *
//*************************************************************************************************
function setZoom() {
    documentZoom = documentZoom <= 0 ? 1 : documentZoom;
    $('#zoom-value').val(documentZoom + '%');
    $('.zoom-wrapper #base').css('transform', 'scale(' + documentZoom / 100 + ')');
}

//*************************************************************************************************
//*                                    Read zoom level.                                           *
//*************************************************************************************************
function getZoom() {
    documentZoom = parseInt($('#zoom-value').val());
}
