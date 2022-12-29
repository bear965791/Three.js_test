//基本設定
let scene, renderer, camera
//
let statsUI
let cameraControl, gui
let sphereLightMesh, pointLight
let rotateAngle = 0
let invert = 1 // 正反向
let rotateHeadOffset = 0
let walkOffset = 0
let scaleHeadOffset = 0
let creeperObj
let stats
let tween, tweenBack
let startTracking = false
let particles //例子物件
function init() {
  // 1.建場景
  scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2(0x000000, 0.0008)
  // 2.相機設定
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )
  camera.position.set(20, 20, 20)
  camera.lookAt(scene.position)

  statsUI = initStats()

  // 3.渲染器設定
  renderer = new THREE.WebGLRenderer()
  renderer.setClearColor(0x111111, 1.0)
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.shadowMap.enabled = true // 設定需渲染陰影效果
  renderer.shadowMap.type = 2 // THREE.PCFSoftShadowMap
  // 設定 OrbitControls
  cameraControl = new THREE.OrbitControls(camera, renderer.domElement);
  cameraControl.enableDamping = true // 啟用阻尼效果
  cameraControl.dampingFactor = 0.25 // 阻尼系數 拖移旋轉時的「滑鼠靈敏度」

  createSnow()

  // 簡單的地板
  const planeGeometry = new THREE.PlaneGeometry(300, 300) //PlaneGeometry 預設是在 z = 0 的 x-y 平面上
  const planeMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff })
  let plane = new THREE.Mesh(planeGeometry, planeMaterial)
  //只有平面體的前側會反射光線，也就是朝向 z 軸正向的方向，
  //因此為了達到預期的讓此平面呈現為 y = 0 的 x-z 平面且可以反射光線，需要將平面體「沿著 x 軸正方向逆時針旋轉 90 度」。
  plane.rotation.x = -0.5 * Math.PI // 使平面與 y 軸垂直，並讓正面朝上(沿著 x 軸正方向逆時針轉 90 度)
  plane.position.set(0, -7, 0)
  // plane.receiveShadow = true //這個屬性打開才會接收其他元素投影的效果。
  plane.name = 'floor'
  scene.add(plane)

  // 產生苦力怕
  createCreeper()

  // 設置環境光提供輔助柔和白光
  let ambientLight = new THREE.AmbientLight(0x404040)
  scene.add(ambientLight)

  // 設置聚光燈幫忙照亮物體
  let spotLight = new THREE.SpotLight(0xf0f0f0)
  spotLight.position.set(-10, 30, 20)
  // spotLight.castShadow = true
  // scene.add(spotLight)

  // 點光源
  pointLight = new THREE.PointLight(0xf0f0f0, 1, 100) // 顏色, 強度, 距離
  pointLight.castShadow = true // 投影
  pointLight.position.set(-30, 30, 30)
  scene.add(pointLight)

  // 將渲染出來的畫面放到網頁上的 DOM
  document.body.appendChild(renderer.domElement)
}

function createCreeper() {
  creeperObj = new Creeper()
  scene.add(creeperObj.creeper)
}

function render() {
  snowAnimation()
  //建立 stats 物件後記得在 render() 裡做 update才會持續更新
  statsUI.update();
  //每 16.67ms（60 fps） 就執行一次 render()
  //因此我們能透過在 render() 中更改物體的位置、旋轉、縮放、材質、形狀等等來達到動畫的效果
  cameraControl.update()
  requestAnimationFrame(render)
  renderer.render(scene, camera)
}

function initStats() {
  const stats = new Stats()
  // 0 ，會顯示「畫面刷新頻率（FPS）」，
  // 設成 1 的話，就會轉換為「畫面渲染時間」。
  stats.setMode(0)
  document.getElementById('stats').appendChild(stats.domElement)
  return stats
}

let datGUIControls = new (function() {
  this.startTracking = false
  this.togglePlayMusic = function() {
    if (musicPlayback) {
      sound.pause()
      musicPlayback = false
    } else {
      sound.play()
      musicPlayback = true
    }
  }
  this.changeScene = function() {
    if (sceneType === 'SNOW') {
      material.map = rainTexture
      material.size = 2
      sceneType = 'RAIN'
    } else {
      material.map = snowTexture
      material.size = 5
      sceneType = 'SNOW'
    }
  }
})()

const particleCount = 20000
const loader = new THREE.TextureLoader();
const vertices = []//
const velocitys = []//方向與速度
let material
const range = 250
function createSnow() {
  const snowUrl = "https://i.postimg.cc/d0SHZk3J/snow.png"
  const particleTexture = loader.load(snowUrl)
  const geometry = new THREE.BufferGeometry();

  for (let i = 0; i < particleCount; i++) {
    const x = THREE.Math.randInt(-range, range)
    const y = THREE.Math.randInt(-range, range)
    const z = THREE.Math.randInt(-range, range)
    const v = THREE.Math.randFloat(-0.16, 0.16)
    vertices.push(x, y, z)
    velocitys.push(v)
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))

  material = new THREE.PointsMaterial({
    size: 5,
    map: particleTexture,
    sizeAttenuation: true,
    alphaTest: 0.5,
    transparent: true,
  })
  particles = new THREE.Points(geometry, material);
  scene.add(particles)
}

/**
 * 動畫相關
*/

function snowAnimation() {
  particles.geometry.attributes.position.array.forEach(function (v, i, positions) {
    if (i % 3 == 0) {
      positions[i] = positions[i] - velocitys[Math.floor(i / 3)];
      if (positions[i] < -range || positions[i] > range) {
        velocitys[Math.floor(i / 3)] = -1 * velocitys[Math.floor(i / 3)];
      }
    }
    else if (i % 3 == 1) {
      positions[i] = positions[i] - THREE.Math.randFloat(0.1, 0.2);
      if (positions[i] < -range) positions[i] = range;
    }
  })
  particles.geometry.attributes.position.needsUpdate = true;
}


/**
 * 苦力怕
*/

class Creeper {
  constructor() {

    // 宣告頭、身體、腳幾何體大小
    const headGeo = new THREE.BoxGeometry(4, 4, 4)
    const bodyGeo = new THREE.BoxGeometry(4, 8, 2)
    const footGeo = new THREE.BoxGeometry(2, 3, 2)

    // 馮氏材質設為綠色
    const creeperMat = new THREE.MeshPhongMaterial({ color: 0x00ff00 })

    /**
     * Texture（紋理）是 Material 中的一個屬性，是拿來作為貼圖的
    */

    // 苦力怕臉部貼圖
    const headMap = new THREE.TextureLoader().load(
      'https://dl.dropboxusercontent.com/s/bkqu0tty04epc46/creeper_face.png'
    )
    // 苦力怕皮膚貼圖
    const skinMap = new THREE.TextureLoader().load(
      'https://dl.dropboxusercontent.com/s/eev6wxdxfmukkt8/creeper_skin.png'
    )
    // 身體與腳的材質設定
    const skinMat = new THREE.MeshStandardMaterial({
      roughness: 1, // 粗糙度
      transparent: true, // 透明與否
      opacity: 0.9, // 透明度
      side: THREE.DoubleSide, // 雙面材質
      map: skinMap // 皮膚貼圖
    })

    // 準備頭部與臉的材質
    // 利用一個陣列裝載六面的材質，其中試出來其中一面是苦力怕臉朝向光的方向，因此讓這面使用臉部貼圖，其他面則用皮膚貼圖
    const headMaterials = []
    for (let i = 0; i < 6; i++) {
      let map

      if (i === 4) map = headMap
      else map = skinMap

      headMaterials.push(new THREE.MeshStandardMaterial({ map: map }))
    }

    // 頭
    this.head = new THREE.Mesh(headGeo, headMaterials)
    this.head.position.set(0, 6, 0)
    this.head.rotation.y = 0.5 // 稍微的擺頭

    // 身體
    this.body = new THREE.Mesh(bodyGeo, skinMat)
    this.body.position.set(0, 0, 0)

    // 四隻腳
    this.foot1 = new THREE.Mesh(footGeo, skinMat)
    this.foot1.position.set(-1, -5.5, 2)
    this.foot2 = this.foot1.clone() // 剩下三隻腳都複製第一隻的 Mesh
    this.foot2.position.set(-1, -5.5, -2)
    this.foot3 = this.foot1.clone()
    this.foot3.position.set(1, -5.5, 2)
    this.foot4 = this.foot1.clone()
    this.foot4.position.set(1, -5.5, -2)

    // 將四隻腳組合為一個 group
    this.feet = new THREE.Group()
    this.feet.add(this.foot1)
    this.feet.add(this.foot2)
    this.feet.add(this.foot3)
    this.feet.add(this.foot4)

    // 將頭、身體、腳組合為一個 group
    this.creeper = new THREE.Group()
    this.creeper.add(this.head)
    this.creeper.add(this.body)
    this.creeper.add(this.feet)
    // 苦力怕投影設定，利用 traverse 遍歷各個子元件設定陰影
    // 提供一個用來遍歷目標物件（creeper）及其所有後代（head、body、feet）的方法，
    // 透過傳入的 function，可以對苦力怕底下的所有子元件都設定陰影效果。
    this.creeper.traverse(function (object) {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true
        object.receiveShadow = true
      }
    })
  }
}

window.addEventListener('resize', function () {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

init()
render()