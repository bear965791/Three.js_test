
let renderer, scene, camera
let cameraControl, stats,material
const velocitys = []; // 方向及速度
let particles, range; // 粒子物件, 範圍
// points
const particleCount = 15000 //建立15000個頂點
let points

const loader = new THREE.TextureLoader();

function initStats() {
    const stats = new Stats()
    stats.setMode(0)
    document.getElementById('stats').appendChild(stats.domElement)
    return stats
}

// 建立粒子系統
function createPoints() {
    const snowUrl = "https://i.postimg.cc/d0SHZk3J/snow.png"
    const particleTexture = loader.load(snowUrl)
    const geometry = new THREE.BufferGeometry();
    const vertices = [];

    const range = 250
    for (let i = 0; i < particleCount; i++) {
        //類似 Math.random() 的包裝
        const x = THREE.Math.randInt(-range, range) //座標在-250~250間
        const y = THREE.Math.randInt(-range, range)
        const z = THREE.Math.randInt(-range, range)
        const v = THREE.Math.randFloat(-0.16, 0.16);
        vertices.push(x, y, z);
        velocitys.push(v);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)
    );

    material = new THREE.PointsMaterial({
        size: 5,
        map: particleTexture,
        sizeAttenuation: true,
        alphaTest: 0.5,
        transparent: true,
    })

   particles  = new THREE.Points(geometry, material);
    scene.add(particles)
}

function init() {
    // scene
    scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x000000, 0.0008)

    // camera
    camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        1,
        1000
    )
    camera.position.set(0, 0, 100)
    camera.lookAt(scene.position)

    // stats
    stats = initStats()

    // let axes = new THREE.AxesHelper(20)
    // scene.add(axes)

    // renderer
    renderer = new THREE.WebGLRenderer()
    renderer.setSize(window.innerWidth, window.innerHeight)

    // OrbitControls
    cameraControl = new THREE.OrbitControls(camera, renderer.domElement)
    cameraControl.enableDamping = true
    cameraControl.dampingFactor = 0.25

    createPoints()

    document.body.appendChild(renderer.domElement)
}

function pointsAnimation() {
    particles.geometry.attributes.position.array.forEach(function (v,i,positions) {
        
        // 改變 x 軸位置
        if (i % 3 == 0){
          positions[i] = positions[i] - velocitys[Math.floor(i/3)];
          if (positions[i] < -range || positions[i] > range) {
            velocitys[Math.floor(i/3)] = -1 * velocitys[Math.floor(i/3)];
          }
        }
        // 改變 y 軸位置
        else if (i % 3 ==1){
          positions[i] = positions[i] - THREE.Math.randFloat(0.1, 0.2);
          if (positions[i] < -range) positions[i] = range;
        }
      })

      particles.geometry.attributes.position.needsUpdate = true;
  }

function render() {
    pointsAnimation()
    stats.update()
    requestAnimationFrame(render)
    cameraControl.update()
    renderer.render(scene, camera)
}

window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
})

init()
render()