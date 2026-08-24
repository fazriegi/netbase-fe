import {
  Affix,
  Button,
  Form,
  Grid,
  Input,
  Skeleton,
  DatePicker,
  Space,
} from "antd";
import PageHeader from "src/components/PageHeader";
import InputSelect from "src/components/input/InpuitSelect";
import InputNumeric from "src/components/input/InputNumeric";

const { useBreakpoint } = Grid;

export default function LiabilityForm({
  form,
  isSubmit = false,
  isLoading = false,
  onFinish,
  breadcrumbs = [],
  type = "add",
  onDelete,
}) {
  const screens = useBreakpoint();

  const formCategoryType = Form.useWatch("category_type", form);

  const handleFinish = (values) => {
    let details = values.details || {};

    if (formCategoryType === "short_term") {
      details = {
        credit_limit: details.credit_limit || 0,
        statement_date: details.statement_date || 1,
        due_date: details.due_date || 1,
        interest_rate: details.interest_rate || 0,
      };
    } else if (formCategoryType === "long_term") {
      details = {
        monthly_installment: details.monthly_installment ?? 0,
        tenor: details.tenor ?? 0,
        due_date: details.due_date || 1,
        interest_rate_pa: details.interest_rate_pa ?? 0,
        start_date: details.start_date
          ? typeof details.start_date.format === "function"
            ? details.start_date.format("YYYY-MM-DD")
            : details.start_date
          : null,
      };
    } else {
      details = {};
    }

    onFinish({
      ...values,
      principal_amount: values.principal_amount ?? 0,
      remaining_balance: values.remaining_balance ?? 0,
      details,
    });
  };

  return (
    <>
      {isLoading ? (
        <Skeleton active paragraph={{ rows: 3 }} />
      ) : (
        <>
          <PageHeader breadCrumb={breadcrumbs} backUrl />
          <Form
            name="liability-add"
            style={{
              marginTop: "2em",
              flex: 1,
              display: "flex",
              flexDirection: "column",
            }}
            labelCol={{ span: 8 }}
            wrapperCol={{ span: 8 }}
            onFinish={handleFinish}
            form={form}
            initialValues={{
              details: {
                statement_date: 1,
                due_date: 1,
                tenor: 12,
                interest_rate_pa: 0,
                interest_rate: 0,
              },
            }}
          >
            <div style={{ flex: 1 }}>
              <Form.Item
                label="Category"
                name="category_id"
                rules={[{ required: true }]}
              >
                <InputSelect
                  datasource="/v1/liabilities/categories"
                  placeholder="Choose One"
                  selectLabel="id"
                  selectValue="name"
                  disabled={type === "edit"}
                  onChange={(_, opt) => {
                    form.setFieldsValue({ category_type: opt.base_type });
                  }}
                />
              </Form.Item>
              <Form.Item name="category_type" hidden>
                <Input />
              </Form.Item>
              <Form.Item label="Name" name="name" rules={[{ required: true }]}>
                <Input placeholder="Name" />
              </Form.Item>
              <Form.Item
                label="Principal Amount"
                name="principal_amount"
                rules={[
                  {
                    required: true,
                    pattern: /^\d+$/,
                    message: "Please enter a valid number",
                  },
                ]}
              >
                <InputNumeric inputStyle={{ width: 100 }} />
              </Form.Item>
              <Form.Item
                label="Remaining Balance"
                name="remaining_balance"
                rules={[
                  {
                    required: true,
                    pattern: /^\d+$/,
                    message: "Please enter a valid number",
                  },
                ]}
              >
                <InputNumeric inputStyle={{ width: 100 }} />
              </Form.Item>

              {formCategoryType === "short_term" && (
                <>
                  <Form.Item
                    label="Credit Limit"
                    name={["details", "credit_limit"]}
                    rules={[
                      {
                        pattern: /^\d+$/,
                        message: "Please enter a valid number",
                      },
                    ]}
                  >
                    <InputNumeric inputStyle={{ width: 100 }} />
                  </Form.Item>
                  <Form.Item label="Statement Date" required>
                    <Space>
                      <Form.Item
                        name={["details", "statement_date"]}
                        noStyle
                        rules={[{ required: true }]}
                      >
                        <InputNumeric
                          inputStyle={{ width: 60 }}
                          min={1}
                          max={31}
                          placeholder="1-31"
                        />
                      </Form.Item>
                      <span>Every Month</span>
                    </Space>
                  </Form.Item>
                  <Form.Item label="Due Date" required>
                    <Space>
                      <Form.Item
                        name={["details", "due_date"]}
                        noStyle
                        rules={[{ required: true }]}
                      >
                        <InputNumeric
                          inputStyle={{ width: 60 }}
                          min={1}
                          max={31}
                          placeholder="1-31"
                        />
                      </Form.Item>
                      <span>Every Month</span>
                    </Space>
                  </Form.Item>
                  <Form.Item label="Interest Rate">
                    <Space>
                      <Form.Item name={["details", "interest_rate"]} noStyle>
                        <InputNumeric inputStyle={{ width: 60 }} />
                      </Form.Item>
                      <span>%</span>
                    </Space>
                  </Form.Item>
                </>
              )}
              {formCategoryType === "long_term" && (
                <>
                  <Form.Item
                    label="Monthly Installment"
                    name={["details", "monthly_installment"]}
                    rules={[{ required: true }]}
                  >
                    <InputNumeric inputStyle={{ width: 100 }} />
                  </Form.Item>
                  <Form.Item label="Tenor" required>
                    <Space>
                      <Form.Item
                        name={["details", "tenor"]}
                        noStyle
                        rules={[{ required: true }]}
                      >
                        <InputNumeric inputStyle={{ width: 60 }} min={12} />
                      </Form.Item>
                      <span>Months</span>
                    </Space>
                  </Form.Item>
                  <Form.Item label="Due Date" required>
                    <Space>
                      <Form.Item
                        name={["details", "due_date"]}
                        noStyle
                        rules={[{ required: true }]}
                      >
                        <InputNumeric
                          inputStyle={{ width: 60 }}
                          min={1}
                          max={31}
                          placeholder="1-31"
                        />
                      </Form.Item>
                      <span>Every Month</span>
                    </Space>
                  </Form.Item>
                  <Form.Item label="Interest Rate">
                    <Space>
                      <Form.Item name={["details", "interest_rate_pa"]} noStyle>
                        <InputNumeric
                          inputStyle={{ width: 60 }}
                          placeholder="Interest Rate"
                        />
                      </Form.Item>
                      <span>% P.A</span>
                    </Space>
                  </Form.Item>
                  <Form.Item
                    label="Start Date"
                    name={["details", "start_date"]}
                    rules={[{ required: true }]}
                  >
                    <DatePicker />
                  </Form.Item>
                </>
              )}
            </div>

            <Affix offsetBottom={50} style={{ marginTop: "3em" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: screens.md ? "flex-end" : "center",
                  padding: "0 16px",
                  flexWrap: "wrap",
                  gap: "1em",
                }}
              >
                {type === "edit" && (
                  <div style={{ width: screens.md ? 120 : "100%" }}>
                    <Button
                      type="default"
                      onClick={onDelete}
                      loading={isSubmit}
                      style={{ width: "100%" }}
                      danger
                    >
                      Delete
                    </Button>
                  </div>
                )}

                <div style={{ width: screens.md ? 120 : "100%" }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isSubmit}
                    style={{ width: "100%" }}
                  >
                    Save
                  </Button>
                </div>
              </div>
            </Affix>
          </Form>
        </>
      )}
    </>
  );
}
