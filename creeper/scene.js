let scene, renderer, camera
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
/**OrbitControls（軌道控制器）
 *  調整畫面視角，透過滑鼠對畫面進行旋轉、平移、縮放的功能
*/

/**stats.js  監控性能的工具
 * 
 */

function init() {
  // 1.建場景
  scene = new THREE.Scene()
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
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.shadowMap.enabled = true // 設定需渲染陰影效果
  /**
   * 而另外一個 renderer.shadowMap.type 是設定陰影貼圖的種類，總共有三種可以設定：
     THREE.BasicShadowMap = 0
     THREE.PCFShadowMap = 1
     THREE.PCFSoftShadowMap = 2
   */
  renderer.shadowMap.type = 2 // THREE.PCFSoftShadowMap
  // 設定 OrbitControls
  cameraControl = new THREE.OrbitControls(camera, renderer.domElement);
  cameraControl.enableDamping = true // 啟用阻尼效果
  cameraControl.dampingFactor = 0.25 // 阻尼系數 拖移旋轉時的「滑鼠靈敏度」
  // cameraControl.autoRotate = true // 啟用自動旋轉

  // 三軸座標輔助
  let axes = new THREE.AxesHelper(20)
  scene.add(axes)

  // 簡單的地板
  const planeGeometry = new THREE.PlaneGeometry(80, 60) //PlaneGeometry 預設是在 z = 0 的 x-y 平面上
  const planeMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff })
  let plane = new THREE.Mesh(planeGeometry, planeMaterial)
  //只有平面體的前側會反射光線，也就是朝向 z 軸正向的方向，
  //因此為了達到預期的讓此平面呈現為 y = 0 的 x-z 平面且可以反射光線，需要將平面體「沿著 x 軸正方向逆時針旋轉 90 度」。
  plane.rotation.x = -0.5 * Math.PI // 使平面與 y 軸垂直，並讓正面朝上(沿著 x 軸正方向逆時針轉 90 度)
  plane.position.set(0, -7, 0)
  plane.receiveShadow = true //這個屬性打開才會接收其他元素投影的效果。
  plane.name = 'floor'
  scene.add(plane)

  // 產生苦力怕
  createCreeper()

  // 簡單的 spotlight 照亮物體
  // 設置聚光燈 SpotLight
  let spotLight = new THREE.SpotLight(0xf0f0f0)
  spotLight.position.set(-10, 30, 20)
  spotLight.castShadow = true
  spotLight.intensity = 0.5
  scene.add(spotLight)
  // let spotLightHelper = new THREE.SpotLightHelper(spotLight)
  // scene.add(spotLightHelper)

  // 設置環境光 AmbientLight
  let ambientLight = new THREE.AmbientLight(0x404040)
  scene.add(ambientLight)

  // 設置移動點光源 PointLight
  pointLight = new THREE.PointLight(0xccffcc, 1, 100) // 顏色, 強度, 距離
  //pointLight.position.set(-10, 20, 20)
  pointLight.castShadow = true
  scene.add(pointLight)
  let pointLightHelper = new THREE.PointLightHelper(pointLight)
  scene.add(pointLightHelper)

  // 小球體模擬點光源實體
  const sphereLightGeo = new THREE.SphereGeometry(0.3)
  const sphereLightMat = new THREE.MeshBasicMaterial({ color: 0xccffcc })
  sphereLightMesh = new THREE.Mesh(sphereLightGeo, sphereLightMat)
  sphereLightMesh.castShadow = true
  sphereLightMesh.position.y = 16
  scene.add(sphereLightMesh)

  // 設置平行光 DirectionalLight
  let directionalLight = new THREE.DirectionalLight(0xffffff)
  directionalLight.position.set(-10, 20, 20)
  directionalLight.castShadow = true
  // scene.add(directionalLight)
  let directionalLightHelper = new THREE.DirectionalLightHelper(
    directionalLight
  )
  // scene.add(directionalLightHelper)

   // dat.GUI 控制面板
   gui = new dat.GUI()
   gui.add(datGUIControls, 'startTracking').onChange(function(e) {
    startTracking = e
    if (invert > 0) {
      if (startTracking) {
        tween.start()
      } else {
        tween.stop()
      }
    } else {
      if (startTracking) {
        tweenBack.start()
      } else {
        tweenBack.stop()
      }
    }
  })

  // 將渲染出來的畫面放到網頁上的 DOM
  document.body.appendChild(renderer.domElement)
}

function createCreeper() {
  creeperObj = new Creeper()
  tweenHandler()
  scene.add(creeperObj.creeper)
}

function render() {
  //建立 stats 物件後記得在 render() 裡做 update才會持續更新
  statsUI.update();
  //先在 Init() 中宣告點光源與模擬光源實體的小球體到場景中，
  //再來要讓小球移動的話就需要在 render() 中加上動畫效果：
  // pointLightAnimation() // update
  // creeperHeadRotate()
  // creeperFeetWalk()
  // creeperScaleBody()
  //每 16.67ms（60 fps） 就執行一次 render()
  //因此我們能透過在 render() 中更改物體的位置、旋轉、縮放、材質、形狀等等來達到動畫的效果
  cameraControl.update()
  creeperFeetWalk()
  TWEEN.update()
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
  // this.startRotateHead = false
  // this.startWalking = false
  // this.startScaleBody = false
  this.startTracking = false
})

/**
 * 動畫相關
*/

function tweenHandler() {
  let offset = { x: 0, z: 0, rotateY: 0 }
  let target = { x: 20, z: 20, rotateY: 0.7853981633974484 } // 目標值

  // 苦力怕走動及轉身補間動畫
  const onUpdate = () => {
    // 移動
    creeperObj.feet.position.x = offset.x
    creeperObj.feet.position.z = offset.z
    creeperObj.head.position.x = offset.x
    creeperObj.head.position.z = offset.z
    creeperObj.body.position.x = offset.x
    creeperObj.body.position.z = offset.z

    // 轉身
    if (target.x > 0) {
      creeperObj.feet.rotation.y = offset.rotateY
      creeperObj.head.rotation.y = offset.rotateY
      creeperObj.body.rotation.y = offset.rotateY
    } else {
      creeperObj.feet.rotation.y = -offset.rotateY
      creeperObj.head.rotation.y = -offset.rotateY
      creeperObj.body.rotation.y = -offset.rotateY
    }
  }

  // 計算新的目標值
  const handleNewTarget = () => {
    // 限制苦力怕走路邊界
    if (camera.position.x > 30) target.x = 20
    else if (camera.position.x < -30) target.x = -20
    else target.x = camera.position.x
    if (camera.position.z > 30) target.z = 20
    else if (camera.position.z < -30) target.z = -20
    else target.z = camera.position.z

    const v1 = new THREE.Vector2(0, 1) // 原點面向方向
    const v2 = new THREE.Vector2(target.x, target.z) // 苦力怕面向新相機方向

    // 內積除以純量得兩向量 cos 值
    let cosValue = v1.dot(v2) / (v1.length() * v2.length())

    // 防呆，cos 值區間為（-1, 1）
    if (cosValue > 1) cosValue = 1
    else if (cosValue < -1) cosValue = -1

    // cos 值求轉身角度
    target.rotateY = Math.acos(cosValue)
  }

  // 朝相機移動
  tween = new TWEEN.Tween(offset)
    .to(target, 3000)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onUpdate(onUpdate)
    .onComplete(() => {
      invert = -1
      tweenBack.start()
    })

  // 回原點
  tweenBack = new TWEEN.Tween(offset)
    .to({ x: 0, z: 0, rotateY: 0 }, 3000)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onUpdate(onUpdate)
    .onComplete(() => {
      handleNewTarget() // 計算新的目標值
      invert = 1
      tween.start()
    })
}

// 點光源繞 Y 軸旋轉動畫
function pointLightAnimation() {
  if (rotateAngle > 2 * Math.PI) {
    rotateAngle = 0 // 超過 360 度後歸零
  } else {
    rotateAngle += 0.04 // 遞增角度
  }

  // 光源延橢圓軌道繞 Y 軸旋轉
  sphereLightMesh.position.x = 4 * Math.cos(rotateAngle)
  sphereLightMesh.position.z = 4 * Math.sin(rotateAngle)
  
  // 點光源位置與球體同步
  pointLight.position.copy(sphereLightMesh.position)
}

// 苦力怕擺頭
function creeperHeadRotate() {
  rotateHeadOffset += 0.04
  creeperObj.head.rotation.y = Math.sin(rotateHeadOffset)
}

// 苦力怕走動
function creeperFeetWalk() {
  walkOffset += 0.04
  
  creeperObj.foot1.rotation.x = Math.sin(walkOffset) / 4 // 前腳左
  creeperObj.foot2.rotation.x = -Math.sin(walkOffset) / 4 // 後腳左
  creeperObj.foot3.rotation.x = -Math.sin(walkOffset) / 4 // 前腳右
  creeperObj.foot4.rotation.x = Math.sin(walkOffset) / 4 // 後腳右
}

// 苦力怕膨脹
function creeperScaleBody() {
  scaleHeadOffset += 0.04
  let scaleRate = Math.abs(Math.sin(scaleHeadOffset)) / 16 + 1
  creeperObj.creeper.scale.set(scaleRate, scaleRate, scaleRate)
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
      metalness: 1, // 金屬感
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