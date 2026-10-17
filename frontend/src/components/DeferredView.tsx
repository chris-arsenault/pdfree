import { Component, Suspense, type ReactNode } from "react";
import { text as tr } from "../i18n/runtime";
import { Modal } from "./Modal";

type Props = { children: ReactNode; onClose?: () => void };

export class DeferredView extends Component<Props, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  frame(content: ReactNode) {
    return this.props.onClose ? (
      <Modal title={tr("common.open")} onClose={this.props.onClose}>
        {content}
      </Modal>
    ) : (
      content
    );
  }
  render() {
    if (this.state.failed)
      return this.frame(
        <div role="alert">
          <p>{tr("errors.operation")}</p>
          <button className="button primary" onClick={() => window.location.reload()}>
            {tr("offline.updateConfirm")}
          </button>
        </div>
      );
    return (
      <Suspense fallback={this.frame(<p role="status">{tr("common.loading")}</p>)}>
        {this.props.children}
      </Suspense>
    );
  }
}
