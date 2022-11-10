import {observer} from "mobx-react-lite";
import {useEffect, Suspense, useState, useRef, createRef} from "react";
import {useGLTF} from "@react-three/drei";
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'
import {ThreeEvent, useFrame, useLoader} from '@react-three/fiber'
import { GLTF } from 'three-stdlib'
import { Select } from '@react-three/postprocessing'
import * as THREE from 'three'
import Alarm from "./Alarm";

interface ModelProps {
    objectData: THREE.Object3D
    configMeshSelect: {[key: string]: boolean}
    selectedMesh: string
    handleClickOnMesh(e: any, mesh: THREE.Object3D): void
    speed: string
}

const listMeshAnimation = [
    'BigGear', 'SmallBottomGear'
]

const Model = observer(({ ...props   }: ModelProps) => {
    let refObj: any = {};
    listMeshAnimation.forEach((item) => {
        refObj[item] = createRef();
    })
    const elRef = useRef<any>(refObj)

    const bottomGear = useRef<any>(null)

    let [blink, setBlink] = useState<boolean>(false)
    let intervalUpdateBlink: any;

    const updateBlink = () => {
        intervalUpdateBlink = !intervalUpdateBlink && setInterval(() => {
            setBlink(!blink)
        }, 500)
    }

    useEffect(() => {
        updateBlink()

        return () => {clearInterval(intervalUpdateBlink)}
    }, [blink]);

    let scale = 1;
    let scaleType = 'up'

    useFrame(({scene}, delta) => {
        listMeshAnimation.forEach((item) => {
            if (elRef?.current[item]) {
                elRef.current[item].current.rotation.x += calculateSpeed(props.speed ? parseInt(props.speed) : 0, delta)
            }
        })

        if (bottomGear?.current) {
            let currentBox = new THREE.Box3().setFromObject(bottomGear.current);
            if (scale >= 2) {
                scaleType = 'down';
            } else if (scale <= 1) {
                scaleType = 'up';
            }

            scale += scaleType === 'up' ? 0.05 : -0.05;
            bottomGear.current.scale.set(1, scale, 1);

            let afterBox = new THREE.Box3().setFromObject(bottomGear.current);

            let distance = afterBox.max.y - currentBox.max.y;

            let currentPos = bottomGear.current.position

            bottomGear.current.position.set(currentPos.x, currentPos.y  + distance, currentPos.z)
        }
    });

    const calculateSpeed = (speed: number, delta: number) => {
        return speed * delta * Math.PI / 2 * 0.03;
    };

    const getGroupMeshes = (
        childArr: THREE.Object3D[] | THREE.Group[] | THREE.Mesh[],
        configMeshSelect: {[key: string]: boolean},
        showWireframe: boolean,
        changeColor: boolean
        ) => {
        let results = [];
        if (childArr.length) {
            for (let i=0; i<childArr.length; i++) {
                if (childArr[i] instanceof THREE.Mesh) {
                    results.push(
                        <Select key={i} enabled={configMeshSelect[childArr[i].uuid]}>
                            <mesh
                                ref={listMeshAnimation.includes(childArr[i].name) ? elRef.current[childArr[i].name] : null}
                                castShadow
                                receiveShadow
                                position={[childArr[i].position.x, childArr[i].position.y, childArr[i].position.z]}
                                rotation={[childArr[i].rotation.x, childArr[i].rotation.y, childArr[i].rotation.z]}
                                scale={[childArr[i].scale.x, childArr[i].scale.y, childArr[i].scale.z]}
                                key={i}
                                geometry={(childArr[i] as THREE.Mesh).geometry}
                                material={(childArr[i] as THREE.Mesh).material}
                                onClick={(e) => {props.handleClickOnMesh(e, childArr[i])}}
                            >
                                {showWireframe &&
                                    <meshStandardMaterial wireframe={true} opacity={0.1} transparent/>
                                }
                                {changeColor && blink &&
                                    <meshStandardMaterial color='red' roughness={0.2} metalness={1} />
                                }
                                {['BigGear', 'MiddleBottomGear'].includes(childArr[i].name) &&
                                    <Alarm />
                                }
                            </mesh>
                        </Select>
                    )
                } else if (childArr[i] instanceof THREE.Object3D || childArr[i] instanceof THREE.Group) {
                    results.push(
                        <Select key={i} enabled={configMeshSelect[childArr[i].uuid]}>
                            <group
                                ref={
                                    listMeshAnimation.includes(childArr[i].name) ?
                                        elRef.current[childArr[i].name] :
                                        childArr[i].name === 'MiddleBottomGear' ? bottomGear : null
                                }
                                position={[childArr[i].position.x, childArr[i].position.y, childArr[i].position.z]}
                                rotation={[childArr[i].rotation.x, childArr[i].rotation.y, childArr[i].rotation.z]}
                                scale={[childArr[i].scale.x, childArr[i].scale.y, childArr[i].scale.z]}
                                onClick={(e) => {props.handleClickOnMesh(e, childArr[i])}}
                            >
                                {showWireframe || childArr[i].name === 'Shell' ?
                                    getGroupMeshes(
                                        childArr[i].children,
                                        configMeshSelect,
                                        true,
                                        !!(changeColor || (props.speed && parseInt(props.speed) > 50 && listMeshAnimation.includes(childArr[i].name)))
                                    ) :
                                    getGroupMeshes(
                                        childArr[i].children,
                                        configMeshSelect,
                                        false,
                                        !!(changeColor || (props.speed && parseInt(props.speed) > 50 && listMeshAnimation.includes(childArr[i].name)))
                                    )
                                }

                                {['BigGear', 'MiddleBottomGear'].includes(childArr[i].name) &&
                                    <Alarm />
                                }
                            </group>
                        </Select>
                    )
                }
            }
        }

        return results.length ? results : null
    }

    const listMeshes = () => {
        if (props.objectData?.children.length) {
            return getGroupMeshes(props.objectData.children, props.configMeshSelect, false, false);
        } else {
            return [];
        }
    }

    return (
        <group position={[0, -0.18856, -0.2855]}>
            <Select enabled={false}>
                {listMeshes()}
            </Select>
        </group>
    );
});

export default Model;
