import {observer} from "mobx-react-lite";
import {useEffect, Suspense, useState} from "react";
import {useGLTF} from "@react-three/drei";
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'
import {ThreeEvent, useLoader} from '@react-three/fiber'
import { GLTF } from 'three-stdlib'
import { Select } from '@react-three/postprocessing'
import * as THREE from 'three'

interface ModelProps {
    objectData: THREE.Object3D
    configMeshSelect: {[key: string]: boolean}
    selectedMesh: string
    handleClickOnMesh(e: any, mesh: THREE.Object3D): void
}

const Model = observer(({ ...props   }: ModelProps) => {
    const getGroupMeshes = (childArr: THREE.Object3D[] | THREE.Group[] | THREE.Mesh[], configMeshSelect: {[key: string]: boolean}) => {
        let results = [];
        if (childArr.length) {
            for (let i=0; i<childArr.length; i++) {
                if (childArr[i] instanceof THREE.Mesh) {
                    results.push(
                        <Select key={i} enabled={configMeshSelect[childArr[i].uuid]}>
                            <mesh
                                position={[childArr[i].position.x, childArr[i].position.y, childArr[i].position.z]}
                                key={i}
                                geometry={(childArr[i] as THREE.Mesh).geometry}
                                material={(childArr[i] as THREE.Mesh).material}
                                onClick={(e) => {props.handleClickOnMesh(e, childArr[i])}}
                            />
                        </Select>
                    )
                } else if (childArr[i] instanceof THREE.Object3D || childArr[i] instanceof THREE.Group) {
                    results.push(
                        <Select key={i} enabled={configMeshSelect[childArr[i].uuid]}>
                            <group position={[childArr[i].position.x, childArr[i].position.y, childArr[i].position.z]}>
                                {getGroupMeshes(childArr[i].children, configMeshSelect)}
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
            return getGroupMeshes(props.objectData.children, props.configMeshSelect);
        } else {
            return [];
        }
    }

    return (
        <group position={[0, -0.18856, -0.2855]}>
            <Select enabled={false}>
                <group>
                    {listMeshes()}
                </group>
            </Select>
        </group>
    );
});

export default Model;
