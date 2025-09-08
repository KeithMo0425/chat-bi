import { useStreamContext } from "@/providers/Stream";
import { Button, Form, FormProps, Input } from "antd";

type FieldType = {
  userInput?: string;
};

export const InterruptPrompt = () => {
  const stream = useStreamContext();

  const onFinish: FormProps<FieldType>["onFinish"] = (values) => {
    stream.submit(
      {
        messages: [{ type: "human", content: values.userInput || '' }]
      },
      {
        command: {
          resume: values.userInput,
        },
      }
    );
  };


  if (!stream.interrupt) {
    return null;
  }

  return <div style={{ marginBottom: 12, padding: 12, border: '1px solid #f0f0f0', borderRadius: 8 }}>
    <p>{(stream.interrupt as any)?.value?.questions?.join(', ')}</p>
    <Form
      name="basic"
      onFinish={onFinish}
      autoComplete="off"
    >
      <Form.Item<FieldType>
        name="userInput"
        rules={[{ required: true, message: 'Please provide the required information!' }]}
      >
        <Input.TextArea autoSize={{ minRows: 2 }} placeholder="Please provide the required information..." />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" block>
          Submit
        </Button>
      </Form.Item>
    </Form>
  </div>
}