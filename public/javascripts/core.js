(function() {
    var canvas,
        context,
        mapImage,
        fromPosition,
        toPosition;

    function render() {
        context.drawImage(mapImage, 0, 0);

        if (fromPosition) {
            context.fillStyle = '#00ff00';
            context.fillRect(fromPosition.x, fromPosition.y, 16, 16);
        }

        if (toPosition) {
            context.fillStyle = '#00ff00';
            context.fillRect(toPosition.x, toPosition.y, 16, 16);
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
            update();
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