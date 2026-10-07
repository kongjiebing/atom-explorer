import { Component } from "react";

// 捕获 WebGL/Three.js 渲染错误，提供降级提示
export default class SceneErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message:
        error?.message || "三维场景初始化失败，可能是当前环境不支持 WebGL。",
    };
  }

  componentDidCatch(error) {
    console.warn("PlantScene render error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-accent/10 text-3xl">
            ⚛
          </div>
          <div className="text-lg font-semibold text-ink">
            三维场景暂不可用
          </div>
          <p className="max-w-md text-sm text-muted">
            当前环境可能不支持 WebGL 渲染。你仍可通过右侧组件列表点击查看每个组件的三级知识解释。
          </p>
          <p className="max-w-md font-mono text-xs text-muted/70">
            {this.state.message}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
