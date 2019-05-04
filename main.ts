//% color='#AA01FF'
namespace Drive {
    export let minSpeed: number = 3;
    export let angleMaxSpeed: number = 15;

    // ---

    // BUG?: do not specify default values, because sometimes the presets are used instead of acual values !

    export let debug: boolean;
    export let stopped: boolean;

    let _motors: motors.SynchedMotorPair;
    let _motor1: motors.Motor;
    let _motor2: motors.Motor;

    let _gyro: sensors.GyroSensor;

    let _motorDirection: number;
    let _gyroDirection: number;

    let _wheelDiameter: number;
    let _wheelBase: number;

    let _moving: boolean;

    let _calibrate: number;

    //% block='Setup wheel motors: %motorPair and Gyro: %gyro with diameter: %wheelDiameter cm and wheelBase: %wheelbase cm || and motor direction forward %motorDirection || and Gyro direction forward %gyroDirection'
    //% motorPair.defl=motors.largeAB
    //% Gyro.defl=sensors.Gyro1
    //% wheelDiameter.min=0.1
    //% wheelDiameter.defl=5.0
    //% wheelBase.min=0.1
    //% wheelBase.defl=5.0
    //% motorDirection.defl=true
    //% gyroDirection.defl=true
    //% group="Setup"
    //% inlineInputMode=inline
    export function setup(motorPair: motors.SynchedMotorPair, gyro: sensors.GyroSensor, wheelDiameter: number, wheelBase: number, motorDirection?: boolean, gyroDirection?: boolean) {
        motorDirection = Tools.defaultValue(motorDirection, true);
        gyroDirection = Tools.defaultValue(gyroDirection, true);

        console.log('setup');

        stopped = true;
        _moving = false;

        _motors = motorPair;
        _gyro = gyro;

        _wheelDiameter = Math.abs(wheelDiameter);
        _wheelBase = Math.abs(wheelBase);

        _motorDirection = (motorDirection) ? 1 : -1;
        _gyroDirection = (gyroDirection) ? 1 : -1;

        _calibrate = 1.0;

        // ---

        let motorStr = _motors.toString();
        switch (motorStr[0]) {
            case 'A': _motor1 = new motors.Motor(Output.A, true); break;
            case 'B': _motor1 = new motors.Motor(Output.B, true); break;
            case 'C': _motor1 = new motors.Motor(Output.C, true); break;
            case 'D': _motor1 = new motors.Motor(Output.D, true); break;
        }
        switch (motorStr[2]) {
            case 'A': _motor2 = new motors.Motor(Output.A, true); break;
            case 'B': _motor2 = new motors.Motor(Output.B, true); break;
            case 'C': _motor2 = new motors.Motor(Output.C, true); break;
            case 'D': _motor2 = new motors.Motor(Output.D, true); break;
        }

        // ---

        console.log('Motor: ' + motorStr);
        console.log('Motor1: ' + _motor1.toString());
        console.log('Motor2: ' + _motor2.toString());
        console.log('Gyro port: ' + _gyro.port());
        console.log('Motor direction: ' + _motorDirection);
        console.log('Gyro direction: ' + _gyroDirection);
        console.log('Wheel diameter: ' + _wheelDiameter);
        console.log('Wheel base: ' + _wheelBase);

        // ---

        _motors.pauseUntilReady();

        music.setVolume(80);

        if (!_gyro.isActive()) {
            brick.setStatusLight(StatusLight.RedPulse);
            brick.clearScreen();
            brick.showString('Gyro not ready', 5);
            music.playSoundEffectUntilDone(sounds.systemPowerDown);
            pause(2 * 1000);
            control.panic(8);
        }

        reset();

        if (Math.abs(_gyro.drift()) >= 0.001) {
            brick.setStatusLight(StatusLight.RedPulse);
            brick.clearScreen();
            brick.showString('Gyro deviation too high', 5);
            music.playSoundEffectUntilDone(sounds.systemPowerDown);
            pause(2 * 1000);
            control.panic(888);
        }

        stopped = false;
    }

    // ---

    //% block
    //% meter.defl=100
    //% group="Setup"
    function calibrate(missingCm: number, meter?: number) {
        meter = Tools.defaultValue(meter, 100);

        _calibrate = (meter - missingCm) / meter;
    }

    function motor2cm(angle: number): number {
        let rotation = _wheelDiameter * Math.PI;
        return (angle / 360) * rotation * _calibrate;
    }

    function fixAngle(angle: number): number {
        return (angle % 180);
    }

    function fixSpeed(speed: number, hasNull: boolean): number {
        if (hasNull) {
            if (Math.abs(speed) <= 0.01) {
                return 0;
            }
        }

        if (Math.abs(speed) < minSpeed) {
            let direction = (speed >= 0) ? 1 : -1;
            return direction * minSpeed;
        }

        return speed;
    }

    // ---

    //% block
    //% group="Info"
    export function isMoving(): boolean {
        return _moving;
    }

    // ---

    //% block
    //% group="Info"
    export function getGyroAngle(): number {
        return _gyro.angle() * _gyroDirection;
    }

    //% block
    //% group="Info"
    export function getMotor1(): number {
        return motor2cm(_motor1.angle() * _motorDirection);
    }

    //% block
    //% group="Info"
    export function getMotor2(): number {
        return motor2cm(_motor2.angle() * _motorDirection);
    }

    //% block
    //% group="Info"
    export function getDistance(m1: number, m2: number): number {
        return (m1 + m2) / 2;
    }

    //% block
    //% group="Info"
    export function info() {
        let gyro = fixAngle(getGyroAngle());

        let motor1 = getMotor1();
        let motor2 = getMotor2();
        let motor = getDistance(motor1, motor2);

        brick.clearScreen();
        brick.showString('    ID: ' + control.deviceSerialNumber(), 3);
        brick.showString('  BATT: ' + brick.batteryLevel(), 4);
        brick.showString('MILLIS: ' + control.millis(), 5);
        brick.showString('  Gyro: ' + Tools.formatNumber(gyro), 7);
        brick.showString('Motor1: ' + Tools.formatNumber(motor1), 9);
        brick.showString('Motor2: ' + Tools.formatNumber(motor2), 10);
        brick.showString(' Motor: ' + Tools.formatNumber(motor), 12);
    }

    // ---

    let _targetCm: number;
    let _currentSpeed: number;
    let _lastMotorSpeed: number;

    //% block
    //% group="Setup"
    export function reset() {
        console.log('reset');

        motorStop(false);

        _targetCm = 0;
        _currentSpeed = 0;
        _lastMotorSpeed = 0;

        _moving = false;

        _motor1.clearCounts();
        _motor2.clearCounts();

        // clear Gyro sensor
        _gyro.setMode(GyroSensorMode.Rate);
        _gyro.setMode(GyroSensorMode.Angle);
    }

    //% block
    //% fixed.defl=true
    //% group="Gyro"
    export function motorStop(fixed?: boolean) {
        fixed = Tools.defaultValue(fixed, true);

        // do not check variable 'stopped' here !!!

        _motors.setBrake(fixed);
        _motors.stop();

        console.log('motorStop');
        console.log('fixed: ' + fixed);

        if (debug)
            music.stopAllSounds();

        _currentSpeed = 0;
        _lastMotorSpeed = 0;
        _moving = false;

        _motorSmooth = 0;
        _angleSmooth = 0;
    }

    let _ts: number = control.millis();
    let _motorSmooth: number = 0;
    let _angleSmooth: number = 0;

    //% block='Motor speed: %speedE || steering: %steering || percent: %percent'
    //% speedE.defl="20"
    //% steering.defl=0
    //% percent.defl=100
    //% group="Setup"
    //% inlineInputMode=inline
    export function motor(speedE: number, steering?: number, percent?: number) {
        speedE = Tools.defaultValue(speedE, _lastMotorSpeed); // important !!!
        steering = Tools.defaultValue(steering, 0);
        percent = Tools.defaultValue(percent, 100);

        console.log('motor');

        // let minPercent = (Math.abs(_lastMotorSpeed) >= minSpeed) ? 5 : 10;
        const minPercent: number = 10;
        percent = Math.max(minPercent, Math.min(100, Math.abs(percent))); // +0...+100

        _lastMotorSpeed += (speedE - _lastMotorSpeed) * (percent / 100);
        // _lastMotorSpeed = fixSpeed(_lastMotorSpeed, true);

        // TODO: not used yet
        let smoothing = 1;

        console.logValue('percent', percent);
        console.logValue('lastMotorSpeed', _lastMotorSpeed);
        console.logValue('motorDirection', _motorDirection);
        console.logValue('steering', steering);

        if (smoothing <= 1) {
            _motorSmooth = _lastMotorSpeed * _motorDirection;
            _angleSmooth = steering;
        } else {
            if (_ts <= control.millis() - 10) {
                _ts = control.millis();

                _motorSmooth = (
                    (_motorSmooth * (smoothing - 1)) +
                    (_lastMotorSpeed * _motorDirection)
                ) / smoothing;

                _angleSmooth = (
                    (_angleSmooth * (smoothing - 1)) +
                    steering
                ) / smoothing;
            } else {
                console.log('motor speed not changed');
                return;
            }

            console.logValue('motorSmooth', _motorSmooth);
            console.logValue('angleSmooth', _angleSmooth);
        }

        if (stopped) return;
        _moving = (_lastMotorSpeed != 0) || (steering != 0);
        _motors.tank(_motorSmooth - _angleSmooth, _motorSmooth + _angleSmooth);

        if (stopped) return;
        pause(20);// motor needs about 20 ms -70 ms to react

        if (debug)
            music.ringTone(440 * (Math.pow(Math.pow(2, 1 / 12), Math.abs(_motorSmooth))));
    }

    let _gyroDiff: number;
    let _lastSteering: number = 0;

    //% block='Drive (with Gyro) on angle: %angle and speed: %speed || Percent: %percent'
    //% speedE.defl="20"
    //% percent.defl=100
    //% group="Setup"
    //% inlineInputMode=inline
    export function gyroMotor(angle: number, speedE?: number, percent?: number) {
        speedE = Tools.defaultValue(speedE, _lastMotorSpeed); // important !!!
        percent = Tools.defaultValue(percent, 100);

        console.log('gyroMotor');

        let gyro = getGyroAngle();
        _gyroDiff = fixAngle(
            fixAngle(angle) - fixAngle(gyro)
        );

        console.logValue('angle', angle);
        console.logValue('diff', _gyroDiff);

        let direction = (_gyroDiff >= 0) ? 1 : -1;
        let diff = Math.abs(_gyroDiff);

        let steering = minSpeed / 2 + (diff / 180 * angleMaxSpeed); // sin=-90..90 | diff=-180..180
        steering = Math.max(0, Math.min(angleMaxSpeed, steering));

        if (Math.abs(diff) < 5) {
            if (steering < Math.abs(_lastSteering) - 1) steering = 0; // cancel the correction early if the error gets smaller
        }

        _lastSteering = (_lastSteering * 1 + (steering * direction) * 3) / 4;

        if (Math.abs(_gyroDiff) <= 0.9) _lastSteering = 0; // permitted degrees deviation

        if (stopped) return;
        motor(speedE, _lastSteering, percent);

        if (stopped) return;
        pause(150); // gyro sensor needs 150 ms - 500 ms
    }

    //% block='Rotate (with Gyro) on angle: %angle || stop: %stop'
    //% halt.defl=true
    //% group="Gyro"
    //% inlineInputMode=inline
    export function gyroRotate(angle: number, halt?: boolean) {
        halt = Tools.defaultValue(halt, true);

        console.log('gyroRotate');

        for (let n = 0; n < 1; n++) {
            const loops = 50;
            let count: number = 0;
            do {
                if (stopped) return;
                gyroMotor(angle, 0 / 0, 0); // speed == 0/0: dont change speed

                if (Math.abs(_gyroDiff) <= 0.9) break;
            } while (count++ < loops);
            console.logValue('count', count);

            if (halt)
                motorStop();

            if (stopped) return;
            pause(500);
        }
    }

    //% block='Drive (with Gyro) %target cm from %angleA to %angleE || with speed: %speedE'
    //% target.defl=10.0
    //% speedE.defl=NaN
    //% group="Gyro"
    //% inlineInputMode=inline
    export function gyroDrive(target: number, angleA: number, angleE: number, speedE?: number) {
        speedE = Tools.defaultValue(speedE, _currentSpeed);

        console.log('gyroDrive');

        let speedA = _currentSpeed;

        let direction = 1;
        direction *= (target >= 0) ? 1 : -1;
        target = Math.abs(target);
        direction *= (speedE >= 0) ? 1 : -1;
        speedE = Math.abs(speedE);

        speedA = fixSpeed(Math.abs(speedA), false);
        speedE = fixSpeed(Math.abs(speedE), false);
        _currentSpeed = fixSpeed(Math.abs(_currentSpeed), false);

        if (Math.abs(_currentSpeed) <= minSpeed) {
            gyroRotate(angleA, false);
        }

        if (!_moving) {
            let motor1 = getMotor1();
            let motor2 = getMotor2();
            _targetCm = getDistance(motor1, motor2);
        }
        let startCm = _targetCm;

        _targetCm += target * direction;

        do {
            let motor1 = getMotor1();
            let motor2 = getMotor2();
            let drivenCm = getDistance(motor1, motor2);

            let percent = Math.abs((drivenCm - startCm) / target) * 100;
            percent = Math.max(0, Math.min(100, Math.abs(percent))); // +0...+100

            let speed = speedA + ((speedE - speedA) * percent / 100);
            if (Math.abs(speed) > minSpeed * 2) {
                // intermediate target reached
                if (direction >= 0) {
                    if ((drivenCm - _targetCm) >= -0.9) break; // shortly before
                } else {
                    if ((drivenCm - _targetCm) <= 0.9) break; // shortly before
                }
            } else {
                // too far driven => drive back
                if (direction >= 0) {
                    if ((drivenCm - _targetCm) > 0) {
                        speed = minSpeed;
                        direction *= -1;
                        percent = 100;
                    }
                } else {
                    if ((drivenCm - _targetCm) < 0) {
                        speed = minSpeed;
                        direction *= -1;
                        percent = 100;
                    }
                }

                // goal reached?
                if (Math.abs(drivenCm - _targetCm) <= 0.3) break;
            }
            _currentSpeed = fixSpeed(speed, false);

            let angle = angleA + ((angleE - angleA) * percent / 100);

            console.logValue('percent', percent);
            console.logValue('angle', angle);
            console.logValue('currentSpeed', _currentSpeed);
            console.logValue('direction', direction);
            console.logValue('driven', drivenCm);

            if (stopped) return;
            gyroMotor(angle, _currentSpeed * direction, percent);
        } while (true);

        if (Math.abs(_currentSpeed) <= minSpeed) {
            gyroRotate(angleE, false);
        }
    }

}

namespace Tools {
    export function defaultValue<T>(value: T, preset: T): T {
        if (('' + value) == 'NaN') value = preset;

        return value;
    }

    export function formatNumber(num: number) {
        let str = '' + Math.round(num * 10) / 10;

        let dot = -1;
        for (let i = 0; i < str.length; i++)
            if (str.charAt(i) == '.') dot = i;

        if (dot == -1) {
            dot = str.length;
            str += '.000';
        }

        return str.substr(0, dot + 2);
    }
}
