// tests go here; this will not be compiled when this package is used as a library

// Drive.debug = true;

function setup1TEST() {
    Drive.setup(motors.largeAB, sensors.gyro1, 6.2, 9, false, false);
    assert('Motor1', Drive.getMotor1(), 0);
    assert('Motor2', Drive.getMotor2(), 0);
    assertFalse('stopped', Drive.stopped);
}

function setup2TEST() {
    Drive.setup(motors.largeAB, sensors.gyro1, 6.2, 9, true, false);
    assert('Motor1', Drive.getMotor1(), 0);
    assert('Motor2', Drive.getMotor2(), 0);
    assertFalse('stopped', Drive.stopped);
}

function motorStopTEST() {
    Drive.stopped = true;
    Drive.motorStop();
    assertTrue('stopped', Drive.stopped); // should not be effected
}

function resetTEST() {
    Drive.stopped = true;
    Drive.reset();
    assert('Motor1', Drive.getMotor1(), 0);
    assert('Motor2', Drive.getMotor2(), 0);
    assertTrue('stopped', Drive.stopped); // should not be effected
}

function timingTEST() {
    const count = 1000;
    let start = 0;

    start = control.millis();
    for (let i = 0; i < count; i++) {
        Drive.getGyroAngle();
    }
    let gyro = (control.millis() - start) / count;
    console.logValue('gyro', gyro);

    start = control.millis();
    for (let i = 0; i < count; i++) {
        Drive.getMotor1();
    }
    let motor1 = (control.millis() - start) / count;
    console.logValue('motor1', motor1);

    start = control.millis();
    for (let i = 0; i < count; i++) {
        Drive.getMotor2();
    }
    let motor2 = (control.millis() - start) / count;
    console.logValue('motor2', motor2);

    // ---

    brick.clearScreen();

    brick.showString('Timing Gyro: ' + gyro * 1000 + ' us', 5);
    brick.showString('Timing Motor1: ' + motor1 * 1000 + ' us', 6);
    brick.showString('Timing Motor2: ' + motor2 * 1000 + ' us', 7);
    pause(5 * 1000);
}

function sensorTEST() {
    const speed: number = 50;
    // const speed: number = 5;

    console.log('TEST');

    Drive.reset();

    pause(1 * 1000);

    // motor speedup time
    motors.largeAB.tank(speed, speed);

    let start: number;

    let motor1_count = 0;
    let motor1_delay: number;
    start = control.millis();
    do {
        motor1_count++;
        motor1_delay = control.millis() - start;

        if (Math.abs(motors.largeA.angle()) > 3) {
            break;
        }
    } while (true);
    pause(100);

    // stop one wheel / detect gyro change
    motors.largeAB.tank(speed, 1);

    let gyro_count = 0;
    let gyro_delay: number;
    start = control.millis();
    do {
        gyro_count++;
        gyro_delay = control.millis() - start;

        if (Math.abs(sensors.gyro1.angle()) > 3) {
            break;
        }
    } while (true);
    pause(100);

    // How long does it take for a motor change to be detected while driving?
    let motor2_angle_start = motors.largeB.angle();

    let motor2_count = 0;
    let motor2_delay: number;
    start = control.millis();
    do {
        motor2_count++;
        motor2_delay = control.millis() - start;

        if (Math.abs(motors.largeB.angle()) > motor2_angle_start) {
            break;
        }
    } while (true);
    pause(100);

    console.log('start delay: ' + motor1_delay + ' ms');
    console.log('motor delay: ' + motor2_delay + ' ms');
    console.log('gyro delay: ' + gyro_delay + ' ms');

    console.log('motor1 count: ' + motor1_count);
    console.log('motor2 count: ' + motor2_count);
    console.log('gyro count: ' + gyro_count);

    console.log('motor1 command: ' + Math.round(motor1_delay / motor1_count * 1000) + ' us');
    console.log('motor2 command: ' + Math.round(motor2_delay / motor2_count * 1000) + ' us');
    console.log('gyro command: ' + Math.round(gyro_delay / gyro_count * 1000) + ' us');

    motors.stopAll();

    motors.largeAB.setBrake(false);
    motors.largeAB.stop();

    pause(5 * 1000);
}

function motorTEST() {
    Drive.reset();
    Drive.motor(10, 0, 100);
    pause(1 * 1000);
    Drive.motorStop();
    assertTrue('Motor1 > 0', Drive.getMotor1() > 0);
    assertTrue('Motor2 > 0', Drive.getMotor2() > 0);

    Drive.reset();
    Drive.motor(-10, 5, 100);
    pause(1 * 1000);
    Drive.motorStop();
    assertTrue('Motor1 < 0', Drive.getMotor1() < 0);
    assertTrue('Motor2 < 0', Drive.getMotor2() < 0);
}

function motorSteeringTEST() {
    // turn left
    Drive.reset();
    Drive.motor(0, 10, 100);
    pause(1 * 1000);
    Drive.motorStop();
    assertTrue('Motor1 > 0', Drive.getMotor1() > 0);
    assertTrue('Motor2 < 0', Drive.getMotor2() < 0);

    // turn right
    Drive.reset();
    Drive.motor(0, -10, 100);
    pause(1 * 1000);
    Drive.motorStop();
    assertTrue('Motor1 < 0', Drive.getMotor1() < 0);
    assertTrue('Motor2 > 0', Drive.getMotor2() > 0);
}

function gyroMotorTEST() {
    let motor1 = 0;
    let motor2 = 0;

    Drive.reset();
    Drive.gyroMotor(0, 30, 100);
    pause(1 * 1000);
    Drive.motorStop();
    motor1 = Math.round(Drive.getMotor1());
    motor2 = Math.round(Drive.getMotor2());
    assertTrue('Motor1 > 0', motor1 > 0);
    assertTrue('Motor2 > 0', motor2 > 0);
    assertTrue('Motor1 == Motor2', motor1 == motor2);

    Drive.reset();
    Drive.gyroMotor(10, 30, 100);
    pause(1 * 1000);
    Drive.motorStop();
    motor1 = Math.round(Drive.getMotor1());
    motor2 = Math.round(Drive.getMotor2());
    assertTrue('Motor1 > 0', motor1 > 0);
    assertTrue('Motor2 > 0', motor2 > 0);
    assertTrue('Motor1 > Motor2', motor1 > motor2);
}

function gyroRotateTEST() {
    Drive.reset();
    Drive.gyroRotate(90);
    let motor1 = Math.round(Drive.getMotor1());
    let motor2 = Math.round(Drive.getMotor2());
    let distance = Math.round(Drive.getDistance(motor1, motor2));
    assertTrue('Motor1 > 0', motor1 > 0);
    assertTrue('Motor2 < 0', motor2 < 0);
    assert('distance', distance, 0);
}

function gyroDriveDistanceTEST() {
    let target = 10;

    Drive.reset();
    Drive.gyroDrive(target / 2, 0, 0, 30);
    Drive.gyroDrive(target / 2, 0, 0, 0);
    Drive.motorStop();

    let motor1 = Drive.getMotor1();
    let motor2 = Drive.getMotor2();
    let distance = Math.round(Drive.getDistance(motor1, motor2));
    assertTrue('distance', distance == target);
}

function gyroDriveTEST() {
    Drive.gyroDrive(5, 0, 0, 30);
    Drive.gyroDrive(5, 0, 0, 0);
    Drive.motorStop(false);
}

function gyroDriveAngleTEST() {
    let w = 10;
    Drive.gyroDrive(10, w, w, 30);
    Drive.gyroDrive(10, w, w);
    Drive.gyroDrive(10, w, w, 0);
    Drive.motorStop();
    pause(1 * 1000);
    Drive.gyroDrive(-10, w, w, 30);
    Drive.gyroDrive(-10, w, w);
    Drive.gyroDrive(-10, w, w, 0);
    Drive.motorStop();
}

// ---

let description: string[] = [
    'setup1TEST',
    'setup2TEST',
    'motorStopTEST',
    'resetTEST',
    'timingTEST',
    'sensorTEST',
    'motorTEST',
    'motorSteeringTEST',
    'gyroMotorTEST',
    'gyroRotateTEST',
    'gyroDriveDistanceTEST',
    'gyroDriveTEST',
    'gyroDriveAngleTEST',
];

let select = [
    setup1TEST,
    setup2TEST,
    motorStopTEST,
    resetTEST,
    timingTEST,
    sensorTEST,
    motorTEST,
    motorSteeringTEST,
    gyroMotorTEST,
    gyroRotateTEST,
    gyroDriveDistanceTEST,
    gyroDriveTEST,
    gyroDriveAngleTEST,
];

let selection: number = 0;

// ---

let menu: boolean = true;

function showMenu() {
    if (menu && !Drive.isMoving()) {
        brick.clearScreen();
        Drive.info();
        brick.showString(description[selection], 1);
    }
}

function execute() {
    brick.clearScreen();

    Drive.stopped = false;

    console.log('');
    console.log('START ' + description[selection]);
    pause(2 * 1000);
    music.playSoundEffectUntilDone(sounds.informationStart);

    let start = control.millis();
    select[selection]();
    let stop = control.millis();

    music.playSoundEffectUntilDone(sounds.informationStop);
    console.log('STOP ' + description[selection]);
    console.log('DURATION:' + ((stop - start) / 1000) + ' seconds');

    Drive.stopped = true;

    pause(5 * 1000);
}

brick.buttonUp.onEvent(ButtonEvent.Pressed, function () {
    menu = false;
})

brick.buttonDown.onEvent(ButtonEvent.Pressed, function () {
    menu = false;
})

brick.buttonLeft.onEvent(ButtonEvent.Pressed, function () {
    menu = true;

    selection--; if (selection < 0) selection = description.length - 1;

    showMenu();
})

brick.buttonRight.onEvent(ButtonEvent.Pressed, function () {
    menu = true;

    selection++; if (selection > description.length - 1) selection = 0;

    showMenu();
})

brick.buttonEnter.onEvent(ButtonEvent.Released, function () {
    menu = false;

    music.playTone(Note.G, 100);

    execute();

    menu = true;

    showMenu();
})

// ---

forever(function () {
    showMenu()

    pause(0.5 * 1000);
});

sensors.touch4.onEvent(ButtonEvent.Pressed, function () {
    Drive.stopped = true;

    motors.stopAll();
    pause(1 * 1000);
    motors.stopAll();
});

sensors.touch4.onEvent(ButtonEvent.Released, function () {
    Drive.stopped = false;
    Drive.reset();
});

// ---

console.sendToScreen();

setup1TEST();

showMenu();

music.playSoundEffectUntilDone(sounds.systemReady);

// ---

function assert<T>(name: string, value: T, target: T) {
    // console.log('assert ' + name);
    // console.log(value + ' (' + target + ')');
    if (value != target) {
        brick.clearScreen();
        brick.showString(name, 4);
        brick.showString('assert missmatch:', 5);
        brick.showString(' expect: ' + target, 6);
        brick.showString(' but got: ' + value, 7);

        music.playSoundEffectUntilDone(sounds.informationError);
        pause(10 * 1000);

        if (Drive.stopped == false)
            control.fail('assert');
    }
}

function assertTrue(name: string, value: boolean) {
    return assert(name, value, true);
}

function assertFalse(name: string, value: boolean) {
    return assert(name, value, false);
}
