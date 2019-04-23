// tests go here; this will not be compiled when this package is used as a library

function GYROmotorTEST() {
    console.sendToScreen();
    console.log("GYROmotorTEST");

    Drive.GYROmotor(90);
}

function GYROrotateTEST() {
    console.sendToScreen();
    console.log("GYROrotateTEST");

    Drive.GYROrotate(90, true);

    // console.log("wait START");
    // control.waitMicros(5000 * 1000);
    // console.log("wait END");

    Drive.GYROrotate(0, true);
}

function GYROdriveTEST() {
    console.sendToScreen();
    console.log("GYROdriveTEST");

    let w = 0;
    Drive.GYROdrive(10, w, w, 30);
    Drive.GYROdrive(10, w, w);
    Drive.GYROdrive(10, w, w, 0);
    Drive.motorStop();
}

// ---

Drive.setup(motors.largeAB, sensors.gyro1, 6.3, 9, false);

brick.buttonLeft.onEvent(ButtonEvent.Pressed, function () {
    // Drive.GYROmotorTEST();
    GYROrotateTEST();
})

brick.buttonRight.onEvent(ButtonEvent.Pressed, function () {
    GYROdriveTEST();
})

brick.buttonEnter.onEvent(ButtonEvent.Pressed, function () {
    brick.clearScreen();

    Drive.reset();


    motors.stopAll();
    brick.clearScreen();

    Drive.motorStop();

    motors.largeAB.setBrake(false);
    motors.largeAB.stop();

    music.playSoundEffect(sounds.systemReady);

    Drive.info();
})

// ----

brick.buttonUp.onEvent(ButtonEvent.Pressed, function () {
    brick.clearScreen();
    sensors.gyro1.reset();
    sensors.gyro1.setMode(GyroSensorMode.Angle);

    Drive.info();
})

/*
brick.buttonDown.onEvent(ButtonEvent.Pressed, function () {
    brick.clearScreen();
})
*/

// ---

sensors.touch4.onEvent(ButtonEvent.Released, function () {
    brick.clearScreen();
    GYROdriveTEST();
});

sensors.touch4.onEvent(ButtonEvent.Pressed, function () {
    brick.clearScreen();
    motors.stopAll();

    Drive.motorStop();

    motors.largeAB.setBrake(false);
    motors.largeAB.stop();

    music.playSoundEffect(sounds.systemReady);

    Drive.info();
});

// ---

brick.showString("STARTED", 1);
Drive.info();
music.playSoundEffectUntilDone(sounds.systemReady);

forever(function () {
    if (!Drive.isMoving())
        Drive.info();
    pause(0.5 * 1000);
});