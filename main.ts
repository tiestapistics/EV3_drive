//% color="#AA01FF"
namespace Drive {
    let _diameter = 5;
    let _wheelbase = 5;
    let _forward = 1;
    let _rotation = _diameter * Math.PI;
    let _turningCircle = _wheelbase * Math.PI;

    let minSpeed = 3;
    let angleSpeed = 15;

    let _drive = false;
    export function isDriving(): boolean {
        return _drive;
    }

    //% block="Setup wheel diameter: %diameter cm and wheelbase: %wheelbase cm || and direction forward %forward"
    //% diameter.defl=5
    //% wheelbase.defl=5
    //% forward.defl=true
    //% inlineInputMode=inline
    export function setup(diameter: number, wheelbase: number, forward?: boolean) {
        _diameter = diameter;
        _wheelbase = wheelbase;
        _forward = (forward) ? 1 : -1;

        _rotation = _diameter * Math.PI;
        _turningCircle = _wheelbase * Math.PI;
    }

    function formatNumber(num: number) {
        let str = "" + Math.round(num * 10) / 10;

        let dot = -1;
        for (let i = 0; i < str.length; i++)
            if (str.charAt(i) == '.') dot = i;

        if (dot == -1) {
            dot = str.length;
            str += ".000";
        }

        return str.substr(0, dot + 2);
    }

    function fixSpeed(speed: number, hasNull: boolean): number {
        if ((speed > 0) && (speed < minSpeed)) speed = minSpeed;
        if ((speed < 0) && (speed > -minSpeed)) speed = -minSpeed;

        if (!hasNull) {
            if (speed == 0) speed = minSpeed;
        }

        return speed;
    }

    function motor2cm(angle: number): number {
        return angle / 360 * _rotation * _forward;
    }

    function motorPos(): number {
        return (
            motor2cm(motors.largeA.angle()) +
            motor2cm(motors.largeB.angle())
        ) / 2;
    }

    export function info() {
        let gyro = sensors.gyro1.angle();
        let motorA = motor2cm(motors.largeA.angle());
        let motorB = motor2cm(motors.largeB.angle());
        let motor = (motorA + motorB) / 2;

        brick.clearScreen();
        brick.showString("    ID: " + control.deviceSerialNumber(), 2);
        brick.showString("  BATT: " + brick.batteryLevel(), 3);
        brick.showString("  GYRO: " + formatNumber(gyro), 4);
        brick.showString("MotorA: " + formatNumber(motorA), 5);
        brick.showString("MotorB: " + formatNumber(motorB), 6);
        brick.showString(" Motor: " + formatNumber(motor), 7);
    }

    export function reset() {
        motorStop();
    }

    // ---

    let _targetCm = 0;
    let _currentSpeed = 0;
    let _lastSpeed = 0;

    export function motorStop() {
        motors.largeAB.setBrake(true);
        motors.largeAB.stop();

        _targetCm = 0;
        _currentSpeed = 0;
        _lastSpeed = 0;
        _drive = false;
    }

    //% block="Motor speed: %speed || steering: %steering || percent: %percent"
    //% speed.defl=20
    //% steering.defl=0
    //% percent.defl=100
    //% inlineInputMode=inline
    export function motor(speed: number, steering?: number, percent?: number) {
        if (("" + percent) == "NaN") percent = 0;
        percent = Math.max(3, Math.min(100, Math.abs(percent))); // +3 ... 100

        if (("" + speed) == "NaN") speed = 0;
        _lastSpeed += (speed - _lastSpeed) * percent / 100;
        _lastSpeed = fixSpeed(_lastSpeed, true);

        _drive = (_lastSpeed != 0) || (steering != 0);
        motors.largeAB.tank((_lastSpeed + steering) * _forward, (_lastSpeed - steering) * _forward);
        control.waitMicros(1);

        // console.log("motor" + " P:" + formatNumber(percent) + " A:" + formatNumber(_lastSpeedA) + " B:" + formatNumber(_lastSpeedB));
        console.logValue("P", percent);
        console.logValue("G", _lastSpeed);
        console.logValue("L", steering);
    }

    //% block="Drive (with GYRO) on angle: %angle and speed: %speed || Percent: %percent"
    //% speed.defl=20
    //% speed.defl=0
    //% percent.defl=0
    //% inlineInputMode=inline
    export function GYROmotor(angle: number, speed?: number, percent?: number) {
        let gyro = sensors.gyro1.angle();
        let diff = gyro - angle;

        let direction = (diff > 0) ? -1 : 1;
        diff = Math.abs(diff);

        let steering = diff / 360 * 20 * angleSpeed;
        steering = Math.max(0, Math.min(angleSpeed, steering));
        if (steering < minSpeed / 2) steering = 0; // kleine Abweichungen nicht korregieren
        if (Math.abs(diff) <= 0.3) steering = 0; // Grad Abweichung

        motor(speed, steering * direction, percent);

        console.log("GYROmotor" + " D:" + formatNumber(diff) + " W:" + formatNumber(angle));
    }

    //% block="Rotate (with GYRO) on angle: %angle || stop: %stop"
    //% stop.defl=true
    //% inlineInputMode=inline
    export function GYROrotate(angle: number, stop?: boolean) {
        for (let i = 0; i < 3; i++) {
            const loops = 15;
            let count = 0;
            do {
                let gyro = sensors.gyro1.angle();
                let diff = gyro - angle;

                if (Math.abs(diff) <= 0.9) break;

                GYROmotor(angle, 0, 0); // 0 Prozent = Aktuelle Speed nicht ändern

                control.waitMicros((10 - (10 * count / loops)) * 1000);
            } while (count++ < loops);

            if (stop)
                motorStop();

            control.waitMicros(50 * 1000);

            console.log("GYROrotate I:" + i + " C:" + count);
        }
    }

    //% block="Drive (with GYRO) %cm cm from %angleA to %angleE || with speed: %speedE"
    //% speedE.defl=NaN
    //% inlineInputMode=inline
    export function GYROdrive(cm: number, angleA: number, angleE: number, speedE?: number) {
        if (("" + speedE) == "NaN") speedE = _currentSpeed;
        speedE = fixSpeed(speedE, false);

        let direction = 1;
        direction *= (cm > 0) ? 1 : -1;
        direction *= (speedE > 0) ? 1 : -1;
        cm = Math.abs(cm);
        speedE = Math.abs(speedE);

        if (Math.abs(_currentSpeed) <= minSpeed) {
            GYROrotate(angleA, false);
        }

        if (_currentSpeed == 0) {
            _targetCm = motorPos();
        }
        let start = _targetCm;

        _targetCm += cm * direction;

        do {
            let pos = motorPos() - start;

            let percent = Math.abs(pos) / Math.abs(cm) * 100;

            let speed = _currentSpeed + ((speedE - _currentSpeed) * percent / 100);
            if (speed > 10) {
                // intermediate target reached?
                if (Math.abs(pos) > Math.abs(cm)) break;
            } else {
                // goal reached?
                if (Math.abs(cm - pos) <= 0.3) break;

                // drive too far? => backward
                if (Math.abs(pos) > Math.abs(cm)) {
                    speed = Math.sign(speed) * - 1 * minSpeed;
                    percent = 100;
                }
            }
            speed = fixSpeed(speed, false);

            let angle = angleA + ((angleE - angleA) * percent / 100);

            GYROmotor(angle, speed * direction, percent);
            _currentSpeed = speed * direction;

            console.log("GYROdrive" + " P:" + formatNumber(pos));
        } while (true);

        if (Math.abs(_currentSpeed) <= minSpeed) {
            GYROrotate(angleE, false);
        }
    }
}
