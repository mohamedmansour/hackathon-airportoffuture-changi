(function() {
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
        animateInterval,
        socketServerInterval;

    function render() {
        context.drawImage(mapImage, 0, 0);

        if (visitedPath) {
            renderPath(visitedPath, {
                color: '#000000',
                lineWidth: 2,
                lineDash: [5]
            });
        }

        if (navigationPath) {
            renderPath(navigationPath, {
                color: '#000000'
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

    function loadImage() {
        var image = new Image(canvas.clientWidth, canvas.clientHeight);
        image.async = true;
        image.onload = function() {
            mapImage = this;
            mapLoaded();
        };
        image.src = '/images/map.png';
    }

    function getPosition(evt) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: (evt.clientX - rect.left - canvas.scrollLeft),
            y: (evt.clientY - rect.top - canvas.scrollTop)
        };
    }

    function onNavigate() {
        var fromGate = from.value;
        var toGate = to.value;
        var errors = [];

        if (!gates[fromGate]) {
            errors.push('From gate does not exist');
        }

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

        fromPosition = gates[fromGate];
        toPosition = gates[toGate];

        easystar.findPath(
            Math.floor(fromPosition.x),
            Math.floor(fromPosition.y),
            Math.floor(toPosition.x),
            Math.floor(toPosition.y),
            function (path) {
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

    function animatePath(path) {
        var pixelsRemaining = path.length;
        if (!visitedPath) {
            //visitedPath = [];
        }
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
        var width = canvas.clientWidth;
        var height = canvas.clientHeight;
        var imageData = context.getImageData(0, 0, width, height);
        var pixel = imageData.data;
        var r = 0, g = 1, b = 2;
        var grid = [];
        var row = [];

        for (var p = 0; p < pixel.length; p+=4) {
            // If white then change to 1;
            if (pixel[p+r] > 253 && pixel[p+g] > 253 && pixel[p+b] > 253) {
                row.push(1);
            }
            else {
                row.push(0);
            }

            // Row
            if ((p/4 + 1) % width === 0) {
                grid.push(row);
                row = [];
            }
        }

        easystar.setGrid(grid);
        easystar.setAcceptableTiles([0]);
        easystar.enableDiagonals();
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
            var command = execution.data.command;
            var data = execution.data.data;
            var executionId = execution.executionId;
        
            switch (command) {
                default:
                    console.log('Command Not Supported', command);
                    break;
            }

            executeCallback(executionId, 'Invalid Command');
        })
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
        loadImage();
        navigate.addEventListener('click', onNavigate, false);
        startFakeSocketServer();
    }

    // Run this once nad copy output to a new file.
    function labelGatesTraining() {
        localStorage.db = localStorage.db || {};
        canvas.addEventListener('click', function (evt) {
            var position = getPosition(evt);
            var locationName = prompt('location');
            console.log(locationName + ':{x:' + position.x+',y:'+position.y+'},');
            localStorage.db[locationName] = position;
        });
    }

    window.addEventListener('DOMContentLoaded', main);
})();