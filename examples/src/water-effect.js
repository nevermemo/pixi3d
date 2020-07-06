let app = new PIXI.Application({
  backgroundColor: 0xdddddd, resizeTo: window, antialias: true
})

let control = new PIXI3D.OrbitCameraControl(app.view)
control.distance = 6
control.orbitTo(-25, 45)

app.loader.add("water.vert", "assets/shaders/water/water.vert")
app.loader.add("water.frag", "assets/shaders/water/water.frag")
app.loader.add("water_dudv.jpg", "assets/textures/water_dudv.jpg")
app.loader.add("autumn.ibl", "assets/environments/autumn.ibl")

// Enable render to texture with depth for the standard render pass. This is
// being done to be able to use the rendered output in the water render pass.
let standardPass = app.renderer.plugins.mesh3d.renderPasses
  .find((pass) => pass.name === "standard")
standardPass.enableRenderToTexture({ depth: true })

// Create a new water render pass and enable render to texture
let waterPass = new PIXI3D.MaterialRenderPass(app.renderer, "water")
waterPass.enableRenderToTexture()
app.renderer.plugins.mesh3d.renderPasses.push(waterPass)

app.loader.load(() => {
  let cube = app.stage.addChild(PIXI3D.Mesh3D.createCube())

  // Create the plane used as water. It will be rendered using the water pass
  // and the water material.
  let water = app.stage.addChild(PIXI3D.Mesh3D.createPlane())
  water.renderPasses = [waterPass.name]
  water.material = new WaterMaterial(app.loader.resources["water_dudv.jpg"].texture, standardPass.colorTexture, standardPass.depthTexture)
  water.scale.set(10, 1, 10)
  water.material.doubleSided = true

  let gui = new dat.GUI()
  gui.add(water.material, "transparency", 0, 1)
  gui.addColor(water.material, "color")

  // To display the final image composition, regular 2d sprites are used. One
  // sprite uses the rendered output from standard pass, and the other sprite
  // uses the rendered output from the water pass. The sprites has to be flipped
  // vertically because PIXI expects the textures to be upside-down (which
  // in this case they are not).
  let sprite1 = app.stage.addChild(new PIXI.Sprite(standardPass.colorTexture))
  sprite1.scale.y = -1

  let sprite2 = app.stage.addChild(new PIXI.Sprite(waterPass.colorTexture))
  sprite2.scale.y = -1

  app.ticker.add(() => {
    water.material.animationTime += 0.002

    // Update the position of the sprites if the browser window was changed.
    sprite1.y = app.renderer.height
    sprite2.y = app.renderer.height
  })

  PIXI3D.LightingEnvironment.main.ibl = app.loader.resources["autumn.ibl"].ibl
})
document.body.appendChild(app.view)

class WaterMaterial extends PIXI3D.Material {
  constructor(waterTexture, sceneColorTexture, sceneDepthTexture) {
    super()

    this.sceneColorTexture = sceneColorTexture
    this.sceneDepthTexture = sceneDepthTexture

    this.waterTexture = waterTexture
    this.waterTexture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT

    this.animationTime = 0;
    this.color = [128, 174, 240]
    this.transparency = 0.5
  }

  updateUniforms(mesh, shader) {
    shader.uniforms.u_World = mesh.worldTransform.toArray()
    shader.uniforms.u_ViewProjection = PIXI3D.Camera3D.main.viewProjection
    shader.uniforms.u_Scene = this.sceneColorTexture
    shader.uniforms.u_SceneDepth = this.sceneDepthTexture
    shader.uniforms.u_WaterDUDV = this.waterTexture
    shader.uniforms.u_ViewSize = [app.renderer.width, app.renderer.height]
    shader.uniforms.u_AnimationTime = this.animationTime
    shader.uniforms.u_WaterColor = this.color.map(c => c / 255)
    shader.uniforms.u_Transparency = this.transparency
  }

  createShader() {
    let program = PIXI.Program.from(
      app.loader.resources["water.vert"].source, app.loader.resources["water.frag"].source)
    return new PIXI3D.MeshShader(program)
  }
}