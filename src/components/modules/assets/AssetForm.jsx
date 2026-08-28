import {
  Affix,
  Button,
  Form,
  Grid,
  Input,
  Skeleton,
  Checkbox,
  DatePicker,
  Space,
} from "antd";
import PageHeader from "src/components/PageHeader";
import InputSelect from "src/components/input/InpuitSelect";
import InputNumeric from "src/components/input/InputNumeric";

const { useBreakpoint } = Grid;

export default function AssetForm({
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

    if (formCategoryType === "liquid") {
      details = {
        platform_name: details.platform_name || "",
        account_name: details.account_name || "",
        account_number: details.account_number || "",
        interest_rate_pa: details.interest_rate_pa ?? 0,
      };
    } else if (formCategoryType === "investment") {
      details = {
        platform_name: details.platform_name || "",
        ticker_symbol: details.ticker_symbol || "",
        average_price: details.average_price ?? 0,
        quantity: details.quantity ?? 0,
      };
    } else if (formCategoryType === "physical") {
      details = {
        model: details.model || "",
        purchase_year: details.purchase_year
          ? typeof details.purchase_year === "object" &&
            typeof details.purchase_year.year === "function"
            ? details.purchase_year.year()
            : parseInt(details.purchase_year, 10)
          : null,
        purchase_price: details.purchase_price ?? 0,
      };
    } else {
      details = {};
    }

    onFinish({
      ...values,
      current_value: values.current_value ?? 0,
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
            name="asset-add"
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
              is_active: true,
            }}
          >
            <div style={{ flex: 1 }}>
              <Form.Item
                label="Category"
                name="category_id"
                rules={[{ required: true }]}
              >
                <InputSelect
                  datasource="/v1/assets/categories"
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
              <Form.Item label="Current Value" name="current_value">
                <InputNumeric inputStyle={{ width: 100 }} />
              </Form.Item>
              <Form.Item
                label="Status"
                name="is_active"
                valuePropName="checked"
                getValueProps={(value) => ({
                  checked: value,
                })}
                getValueFromEvent={(e) => e.target.checked}
                rules={[{ required: true }]}
              >
                <Checkbox>Active</Checkbox>
              </Form.Item>

              {formCategoryType === "liquid" && (
                <>
                  <Form.Item
                    label="Bank / Platform"
                    name={["details", "platform_name"]}
                    rules={[{ required: true }]}
                  >
                    <Input placeholder="Bank / Platform" />
                  </Form.Item>
                  <Form.Item
                    label="Account Name"
                    name={["details", "account_name"]}
                  >
                    <Input placeholder="Account Name" />
                  </Form.Item>
                  <Form.Item
                    label="Account Number"
                    name={["details", "account_number"]}
                  >
                    <Input placeholder="Account Number" />
                  </Form.Item>
                  <Form.Item label="Interest Rate">
                    <Space>
                      <Form.Item name={["details", "interest_rate_pa"]} noStyle>
                        <InputNumeric inputStyle={{ width: 60 }} />
                      </Form.Item>
                      <span>% P.A</span>
                    </Space>
                  </Form.Item>
                </>
              )}
              {formCategoryType === "investment" && (
                <>
                  <Form.Item
                    label="Platform"
                    name={["details", "platform_name"]}
                    rules={[{ required: true }]}
                  >
                    <Input placeholder="Platform" />
                  </Form.Item>
                  <Form.Item
                    label="Ticker"
                    name={["details", "ticker_symbol"]}
                    rules={[{ required: true }]}
                  >
                    <Input placeholder="Ticker / Symbol" />
                  </Form.Item>
                  <Form.Item
                    label="Average Price"
                    name={["details", "average_price"]}
                    rules={[
                      {
                        required: true,
                        pattern: /^[0-9]+(\.[0-9]+)?$/,
                        message: "Please enter a valid number",
                      },
                    ]}
                  >
                    <InputNumeric inputStyle={{ width: 120 }} step="any" />
                  </Form.Item>
                  <Form.Item
                    label="Quantity"
                    name={["details", "quantity"]}
                    rules={[
                      {
                        required: true,
                        pattern: /^\d+$/,
                        message: "Please enter a valid number",
                      },
                    ]}
                  >
                    <InputNumeric inputStyle={{ width: 60 }} />
                  </Form.Item>
                </>
              )}
              {formCategoryType === "physical" && (
                <>
                  <Form.Item
                    label="Brand / Model"
                    name={["details", "model"]}
                    rules={[{ required: true }]}
                  >
                    <Input placeholder="Brand / Model" />
                  </Form.Item>
                  <Form.Item
                    label="Purchase Year"
                    name={["details", "purchase_year"]}
                  >
                    <DatePicker picker="year" placeholder="Purchase Year" />
                  </Form.Item>
                  <Form.Item
                    label="Purchase Price"
                    name={["details", "purchase_price"]}
                    rules={[
                      {
                        required: true,
                        pattern: /^\d+$/,
                        message: "Please enter a valid number",
                      },
                    ]}
                  >
                    <InputNumeric inputStyle={{ width: 120 }} />
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
