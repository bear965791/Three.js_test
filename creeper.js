let scene, renderer, camera
let cube
  
function init(){
  scene = new THREE.Scene()
  // 相機設定與 OrbitControls
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )

  camera.position.set(30, 20, 10)
  camera.lookAt(scene.position)

  stats = initStats()

// 建立 OrbitControls
cameraControl = new OrbitControls(camera, renderer.domElement)
cameraControl.enableDamping = true // 啟用阻尼效果
cameraControl.dampingFactor = 0.25 // 阻尼系數
// cameraControl.autoRotate = true // 啟用自動旋轉
   // 三軸座標輔助
   let axes = new THREE.AxesHelper(20)
   scene.add(axes)
     // 渲染器設定
  renderer = new THREE.WebGLRenderer()
  renderer.setSize(window.innerWidth, window.innerHeight)
    // 簡單的地板
  const planeGeometry = new THREE.PlaneGeometry(60, 60) //PlaneGeometry 預設是在 z = 0 的 x-y 平面上
  const planeMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff })
  let plane = new THREE.Mesh(planeGeometry, planeMaterial)
  //只有平面體的前側會反射光線，也就是朝向 z 軸正向的方向，
  //因此為了達到預期的讓此平面呈現為 y = 0 的 x-z 平面且可以反射光線，需要將平面體「沿著 x 軸正方向逆時針旋轉 90 度」。
  plane.rotation.x = -0.5 * Math.PI // 使平面與 y 軸垂直，並讓正面朝上(沿著 x 軸正方向逆時針轉 90 度)
  plane.position.set(0, -7, 0)
  scene.add(plane)
  // 產生苦力怕
  createCreeper()

  // 簡單的 spotlight 照亮物體
  let spotLight = new THREE.SpotLight(0xffffff)
  spotLight.position.set(30, 20, 0)
  scene.add(spotLight)
  // let spotHelper = new THREE.SpotLightHelper(spotLight)
  // scene.add(spotHelper)

  // 將渲染出來的畫面放到網頁上的 DOM

  document.body.appendChild(renderer.domElement)
}

function render() {
	requestAnimationFrame(render)
	cameraControl.update() // 需設定 update
	renderer.render(scene, camera)
}

function initStats() {
  const stats = new Stats()
  stats.setMode(0)
  document.getElementById('stats').appendChild(stats.domElement)
  return stats
}

  // 生成苦力怕並加到場景
function createCreeper() {
  const creeperObj = new Creeper()
  scene.add(creeperObj.creeper)
}

class Creeper {
  constructor() {
    // 宣告頭、身體、腳幾何體大小
    const headGeo = new THREE.BoxGeometry(4, 4, 4)
    const bodyGeo = new THREE.BoxGeometry(4, 8, 2)
    const footGeo = new THREE.BoxGeometry(2, 3, 2)

    // 馮氏材質設為綠色
    const creeperMat = new THREE.MeshPhongMaterial({ color: 0x00ff00 })

    // 頭
    this.head = new THREE.Mesh(headGeo, creeperMat)
    this.head.position.set(0, 6, 0)

    // 身體
    this.body = new THREE.Mesh(bodyGeo, creeperMat)
    this.body.position.set(0, 0, 0)

    // 四隻腳
    this.foot1 = new THREE.Mesh(footGeo, creeperMat)
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
  }
}

window.addEventListener('resize', function() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

init()
render()