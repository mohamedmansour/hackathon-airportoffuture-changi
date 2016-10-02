var App = (function() {
    var canvas,
        context,
        mapImage,
        fromPosition,
        toPosition,
        easystar,
        originalPath,
        navigationPath,
        visitedPath,
        robotMoving,
        concern,
        animateInterval,
        socketServerInterval,
        sosList = [];

    function render() {
        context.drawImage(mapImage, 0, 0);

        if (visitedPath) {
            renderPath(visitedPath, {
                color: '#00FF00',
                lineWidth: 5,
                lineDash: [5]
            });
        }

        if (navigationPath) {
            renderPath(navigationPath, {
                color: '#00FF00',
                lineWidth: 6
            });
        }

        if (fromPosition) {
            renderPosition(fromPosition, {
                text: 'from',
                fillColor: '#007FFF',
                textColor: 'white'
            });
        }

        if (toPosition) {
            renderPosition(toPosition, {
                text: 'to',
                fillColor: '#007FFF',
                textColor: 'white'
            });
        }

        if (robotMoving) {
            renderPosition(robotMoving, {
                text: 'R',
                fillColor: '#BFFF00',
                textColor: 'black'
            });
        }
    }

    function renderPath(path, params) {
        if (!path.length) {
            return;
        }

        var lineWidth = params.lineWidth || 4;
        var color = params.color || '#000000';
        var lineDash = params.lineDash || [0];
        var pathIndex = 0;
        var currentPoint;

        context.setLineDash(lineDash)
        context.lineWidth = lineWidth;
        context.beginPath(); 
        context.strokeStyle = color;
        context.moveTo(path[0].x, path[0].y); 

        do {
            currentPoint = path[pathIndex];
            context.lineTo(currentPoint.x, currentPoint.y);
            pathIndex = pathIndex + 5;
        }
        while (pathIndex < path.length)

        context.stroke();
        context.closePath();
    }

    function renderPosition(position, params) {
        var diameter = params.diameter || 32;
        var text = params.text || '';
        var textColor = params.textColor || '#ffffff';
        var fillColor = params.fillColor || '#000000';

        if (!position || position.x === undefined || position.y === undefined) {
            console.error('Dev Error in renderPosition');
            return;
        }

        context.beginPath();
        context.fillStyle = fillColor;
        context.arc(position.x, position.y, diameter / 2, 0, 2 * Math.PI, false);
        context.fill();
        context.font = '8pt Lato';
        context.fillStyle = textColor;
        context.textAlign = 'center';
        context.fillText(text, position.x, position.y + 3);
        context.closePath();
    }

    function renderAllGates() {
        for (var name in gates) {
            var gate = gates[name];
            context.fillRect(gate.x, gate.y, 16, 16);
        }
    }

    function update() {
        requestAnimationFrame(update);
        context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
        render();
    }

    function loadImage(src) {
        var image = new Image(canvas.clientWidth, canvas.clientHeight);
        image.async = true;
        image.onload = function() {
            mapImage = this;
            mapLoaded();
        };
        image.src = src;
    }

    function getPosition(evt) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: (evt.clientX - rect.left - canvas.scrollLeft),
            y: (evt.clientY - rect.top - canvas.scrollTop)
        };
    }

    function triggerRobotNavigation(fromGatePosition, toGate) {
        var errors = [];

        if (!gates[toGate]) {
            errors.push('To gate does not exist');
        }

        if (errors.length) {
            alert(errors.join(', '));
            return;
        }

        if (animateInterval) {
            clearInterval(animateInterval);
            navigationPath = null;
            visitedPath = null;
        }

        fromPosition = fromGatePosition;
        toPosition = gates[toGate];

        var startTime = +new Date;
        easystar.findPath(
            Math.floor(fromPosition.x),
            Math.floor(fromPosition.y),
            Math.floor(toPosition.x),
            Math.floor(toPosition.y),
            function (path) {
                console.log(elapsed(startTime) + 's - Path');
                if (path === null) {
                    alert("Path was not found.");
                } else {
                    originalPath = path;
                    navigationPath = path;
                    animatePath(path);
                }
            });
        easystar.calculate();
    }

    function onNavigate() {
        var fromGate = from.value;
        var toGate = to.value;

        if (!gates[fromGate]) {
            alert('from not found');
            return;
        }
        if (!gates[toGate]) {
            alert('to not found');
            return;
        }
        triggerRobotNavigation(gates[fromGate], toGate);
    }

    function animatePath(path) {
        var pixelsRemaining = path.length;

        animateInterval = setInterval(function() {
            if (pixelsRemaining <= 0) {
                clearInterval(animateInterval);
                navigationPath = null;
                return;
            }

            var pathIndex = path.length - pixelsRemaining;
            robotMoving = path[pathIndex];
            pixelsRemaining -= 2;

            navigationPath = originalPath.slice(pathIndex + 1);
            visitedPath = originalPath.slice(0, pathIndex + 1);
        }, 30); 
        robotMoving = path[0];
    }

    function mapLoaded() {
        // Start the update game loop.
        update();
        preparePathFinding();
    }

    function preparePathFinding() {
        easystar = new EasyStar.js();

        // Normalize each pixel for each map, 0 = good, 1 = bad.
        var startTime = +new Date;
        var width = canvas.clientWidth;
        var height = canvas.clientHeight;
        var imageData = context.getImageData(0, 0, width, height);
        var pixel = imageData.data;
        var grid = [];
        var row = [];

        for (var p = 0; p < pixel.length; p+=4) {
            var r = pixel[p];
            var g = pixel[p+1];
            var b = pixel[p+2];
            // NOT ACCESSIBLE
            if (r > 253 && g > 253 && b > 253) {
                row.push(1);
                imageData.data[p] = 0;
                imageData.data[p+1] = 0;
                imageData.data[p+2] = 0;
            }
            // TRAM
            else if (r < 2 && (g > 119 && g < 124) && (b > 193 && b < 200)) {
                row.push(2);

                imageData.data[p] = 255;
                imageData.data[p+1] = 0;
                imageData.data[p+2] = 0;
            }
            // 
            else {
                row.push(0);
                imageData.data[p] = 0;
                imageData.data[p+1] = 0;
                imageData.data[p+2] = 255;
            }

            // Row
            if ((p/4 + 1) % width === 0) {
                grid.push(row);
                row = [];
            }
        }

        context.putImageData(imageData, 0, 0);
        var newImage= new Image();
        newImage.onload = function () {
            mapImage = this;
        }
        newImage.src =  canvas.toDataURL();
    

        easystar.setGrid(grid);
        easystar.setAcceptableTiles([0, 2]);
        easystar.setTileCost(0, 2);
        easystar.setTileCost(1, 1);
        easystar.enableDiagonals();

        console.log(elapsed(startTime) + 's - Setup');
    }

    function elapsed(t) {
        return (((+new Date) - t) / 1000).toFixed(3);
    }

    function startFakeSocketServer() {
        socketServerInterval = setInterval(function() {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', '/api', true);
            xhr.onload = function(e) {
                if (xhr.status === 200) {
                    var json = JSON.parse(xhr.responseText);
                    handleServerResponse(json);
                }
            }
            xhr.send(null);
        }, 500);
    }

    function handleServerResponse(json) {
        if (!json || !json.data) {
            console.error('Something went wrong in socket', json)
            return;
        }
        
        json.data.forEach(function(execution) {
            var command = execution.data.command.toLowerCase();
            var data = execution.data.data;
            var executionId = execution.executionId;
            var responseData = 'Invalid Command';

            switch (command) {
                case 'getdistance':
                    responseData = handleDistance(data);
                    break;
                case 'concern':
                    handleConcern(data);
                    responseData = 'Response Handled';
                    break;
                case 'sos':
                    if (gates[data]) {
                        handleSOS(data);
                        responseData = 'Response Handled';
                    }
                    else {
                        responseData = 'Invalid Gate: ' + data;
                    }
                    break;
                default:
                    console.log('Command Not Supported', command);
                    break;
            }

            executeCallback(executionId, responseData);
        })
    }

    function dispatch(gateName) {
        triggerRobotNavigation(robotMoving, gateName);
    }

    function handleDistance(data) {
        var destination = gates[data];
        if (!destination) {
            return 'Gate not found';
        }

        var theta = Math.atan2(destination.y - robotMoving.y, destination.x - robotMoving.x);
        return Math.abs(theta);
    }

    function handleConcern(data) {
        var sosHTML = ' \
                <span class="sosTitle">Concern at Current Location \
                <span class="sosLocation">' + data + '</span></span> \
        ';
        var sosDOM = document.createElement('div');
        sosDOM.className = 'sos-item';
        sosDOM.innerHTML = sosHTML;
        sos.appendChild(sosDOM)
    }

    function handleSOS(gateName) {
        var sosHTML = ' \
                <span class="sosTitle">Incident at Location \
                <span class="sosLocation">' + gateName + '</span></span> \
                <button onclick="App.dispatch(\'' +  gateName + '\')">Dispatch</span> \
        ';
        var sosDOM = document.createElement('div');
        sosDOM.className = 'sos-item';
        sosDOM.innerHTML = sosHTML;

        if (!sosList.length) {
            sos.innerHTML = '';
        }
        sosList.push(gateName);
        sos.appendChild(sosDOM)
    }

    function executeCallback(executionId, data) {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/callback', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onload = function(e) {
            if (xhr.status === 200) {
                console.log('CALLBACK', xhr.responseText);
            }
        }
        xhr.send(JSON.stringify({
            status: true,
            data: data,
            executionId: executionId
        }));
    }

    function main() {
        canvas = monitor;
        context = canvas.getContext('2d');
        loadImage('/images/map.png');
        navigate.addEventListener('click', onNavigate, false);
        //startFakeSocketServer();

        // Initial Robot Position.
        robotMoving = gates['f42'];
        //labelGatesTraining();
    }

    // Run this once nad copy output to a new file.
    function labelGatesTraining() {
        localStorage.db = localStorage.db || {};
        canvas.addEventListener('click', function (evt) {
            var position = getPosition(evt);
            var locationName = prompt('location');
            if (locationName) {
                console.log(locationName + ':{x:' + position.x+',y:'+position.y+'},');
                localStorage.db[locationName] = position;
            }
        });
    }

    window.addEventListener('DOMContentLoaded', main);

    return  {
        dispatch: dispatch
    }
})();