(function() {
    var canvas,
        context,
        mapImage,
        fromPosition,
        toPosition,
        easystar,
        navigationPath,
        robotMoving;

    function render() {
        context.drawImage(mapImage, 0, 0);

        if (navigationPath) {
            context.fillStyle = '#000000';

            for (var pathIndex in navigationPath) {
                var path = navigationPath[pathIndex];
                context.fillRect(path.x, path.y, 6, 6);
            }
        }

        if (fromPosition) {
            context.fillStyle = '#007FFF';
            context.fillRect(fromPosition.x, fromPosition.y, 16, 16);
        }

        if (toPosition) {
            context.fillStyle = '#007FFF';
            context.fillRect(toPosition.x, toPosition.y, 16, 16);
        }

        if (robotMoving) {
            context.fillStyle = '#BFFF00';
            context.fillRect(robotMoving.x, robotMoving.y, 16, 16);
        }
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
                    navigationPath = path;
                    animatePath(path);
                }
            });
        easystar.calculate();
    }

    function animatePath(path) {
        alert(path.length);
        var pixelsRemaining = path.length;
        var animateInterval = setInterval(function() {
            if (pixelsRemaining <= 0) {
                clearInterval(animateInterval);
                return;
            }
            robotMoving = path[path.length - pixelsRemaining];
            pixelsRemaining -= 5;
        }, 500); 
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
        //easystar.setIterationsPerCalculation(1000);
    }

    function main() {
        canvas = monitor;
        context = canvas.getContext('2d');
        loadImage();
        navigate.addEventListener('click', onNavigate, false);
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